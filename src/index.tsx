import {
  Action,
  ActionPanel,
  Clipboard,
  Detail,
  Icon,
  List,
  Toast,
  open,
  showToast,
} from "@raycast/api";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getLastOpenTrace,
  getMenuBarItemDebugInfo,
  listMenuBarItems,
  normalizeError,
  useHelperPath,
} from "./helper-client";
import {
  clearCachedMenuBarCatalog,
  readCachedMenuBarCatalog,
  readStaleMenuBarCatalog,
  writeCachedMenuBarCatalog,
} from "./menu-bar-catalog-cache";
import { openSelectedMenuBarItem } from "./menu-bar-opening";
import { displayTitle, itemIcon, openHint } from "./menu-bar-presentation";
import { HelperError, MenuBarItem } from "./menu-bar-types";

export default function Command() {
  const helperPath = useHelperPath();
  const [items, setItems] = useState<MenuBarItem[]>(
    () => readCachedMenuBarCatalog(helperPath) ?? [],
  );
  const [error, setError] = useState<HelperError | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const itemsRef = useRef(items);
  const requestIdRef = useRef(0);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const refresh = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const hadItems = itemsRef.current.length > 0;
    const staleItems = readStaleMenuBarCatalog(helperPath);

    if (!hadItems) {
      setIsLoading(true);
    }
    setError(undefined);

    try {
      const nextItems = await listMenuBarItems(helperPath);
      if (requestId !== requestIdRef.current) return;
      itemsRef.current = nextItems;
      setItems(nextItems);
      writeCachedMenuBarCatalog(helperPath, nextItems);
    } catch (caughtError) {
      if (requestId !== requestIdRef.current) return;
      const nextError = normalizeError(caughtError);

      if (nextError.code === "accessibility_permission_required") {
        clearCachedMenuBarCatalog(helperPath);
        itemsRef.current = [];
        setItems([]);
        setError(nextError);
        return;
      }

      if (hadItems) {
        await showToast({
          style: Toast.Style.Failure,
          title: nextError.message ?? "Unable to refresh menu bar items",
          message: nextError.recoverySuggestion,
        });
      } else if (staleItems?.length) {
        itemsRef.current = staleItems;
        setItems(staleItems);
        await showToast({
          style: Toast.Style.Failure,
          title: nextError.message ?? "Showing cached menu bar items",
          message: nextError.recoverySuggestion,
        });
      } else {
        itemsRef.current = [];
        setItems([]);
        setError(nextError);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [helperPath]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (error) {
    return (
      <ErrorView error={error} helperPath={helperPath} onRefresh={refresh} />
    );
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search menu bar items...">
      <List.EmptyView
        icon={Icon.CircleDisabled}
        title="No Menu Bar Items Found"
        description="Only items currently exposed through macOS Accessibility can appear here."
        actions={
          <ActionPanel>
            <Action
              title="Refresh"
              icon={Icon.ArrowClockwise}
              onAction={refresh}
            />
          </ActionPanel>
        }
      />
      {items.map((item) => (
        <MenuBarListItem
          key={item.id}
          helperPath={helperPath}
          item={item}
          onRefresh={refresh}
        />
      ))}
    </List>
  );
}

function MenuBarListItem(props: {
  helperPath: string;
  item: MenuBarItem;
  onRefresh: () => void;
}) {
  const { helperPath, item, onRefresh } = props;
  const title = displayTitle(item);

  return (
    <List.Item
      title={title}
      icon={itemIcon(item)}
      keywords={
        [item.processName, item.bundleId, item.title].filter(
          Boolean,
        ) as string[]
      }
      actions={
        <ActionPanel>
          <Action
            title="Open Menu"
            icon={Icon.Mouse}
            onAction={async () => {
              await openSelectedMenuBarItem(helperPath, item, onRefresh);
            }}
          />
          <Action
            title="Refresh"
            icon={Icon.ArrowClockwise}
            shortcut={{ modifiers: ["cmd"], key: "r" }}
            onAction={onRefresh}
          />
          <ActionPanel.Section title="Diagnostics">
            <Action
              title="Copy Debug Info"
              icon={Icon.Bug}
              onAction={async () => {
                await copyDebugInfo(helperPath, item);
              }}
            />
            <Action
              title="Copy Last Open Trace"
              icon={Icon.Terminal}
              shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
              onAction={async () => {
                await copyLastOpenTrace(helperPath);
              }}
            />
            <Action.CopyToClipboard title="Copy Identifier" content={item.id} />
            {item.bundleId ? (
              <Action.CopyToClipboard
                title="Copy Bundle Identifier"
                content={item.bundleId}
              />
            ) : null}
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

function ErrorView(props: {
  error: HelperError;
  helperPath: string;
  onRefresh: () => void;
}) {
  const { error, helperPath, onRefresh } = props;
  const markdown = [
    `# ${error.message ?? "Unable to List Menu Bar Items"}`,
    "",
    error.recoverySuggestion ??
      "Check that the helper is built and Raycast has Accessibility permission.",
    "",
    "## Helper",
    "",
    `\`${helperPath}\``,
    "",
    "## Notes",
    "",
    "- macOS must grant Accessibility permission to the process running this extension.",
    "- This extension uses public Accessibility APIs only. Items not exposed through Accessibility cannot appear.",
  ].join("\n");

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action
            title="Refresh"
            icon={Icon.ArrowClockwise}
            onAction={onRefresh}
          />
          <Action
            title="Open Accessibility Settings"
            icon={Icon.Gear}
            onAction={() =>
              open(
                "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility",
              )
            }
          />
          <Action.CopyToClipboard
            title="Copy Helper Path"
            content={helperPath}
          />
        </ActionPanel>
      }
    />
  );
}

async function copyDebugInfo(helperPath: string, item: MenuBarItem) {
  const toast = await showToast({
    style: Toast.Style.Animated,
    title: `Collecting ${displayTitle(item)} debug info`,
  });

  try {
    const debugInfo = await getMenuBarItemDebugInfo(
      helperPath,
      item.id,
      openHint(item),
    );
    await Clipboard.copy(JSON.stringify(debugInfo, null, 2));
    toast.style = Toast.Style.Success;
    toast.title = "Copied debug info";
  } catch (caughtError) {
    const error = normalizeError(caughtError);
    toast.style = Toast.Style.Failure;
    toast.title = error.message ?? "Unable to copy debug info";
    toast.message = error.recoverySuggestion;
  }
}

async function copyLastOpenTrace(helperPath: string) {
  try {
    const trace = await getLastOpenTrace(helperPath);
    await Clipboard.copy(JSON.stringify(trace, null, 2));
    await showToast({
      style: Toast.Style.Success,
      title: "Copied last open trace",
    });
  } catch (caughtError) {
    const error = normalizeError(caughtError);
    await showToast({
      style: Toast.Style.Failure,
      title: error.message ?? "Unable to copy last open trace",
      message: error.recoverySuggestion,
    });
  }
}
