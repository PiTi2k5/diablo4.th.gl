"use client";
import { PATREON_BASE_URI } from "@/app/lib/env";
import { useAccountStore } from "@/app/lib/storage/account";
import { useSettingsStore } from "@/app/lib/storage/settings";
import { useEffect, useRef } from "react";
import { GAME_CLASS_ID, HOTKEYS, WINDOWS } from "../lib/config";
import { startNewGameSession } from "../lib/game-sessions";
import { getRunningGameInfo } from "../lib/games";
import { waitForOverwolf } from "../lib/overwolf";
import {
  closeMainWindow,
  closeWindow,
  getPreferedWindowName,
  moveToOtherScreen,
  restoreWindow,
  toggleWindow,
} from "../lib/windows";

export default function Init() {
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) {
      return;
    }
    waitForOverwolf()
      .then(() => {
        initialized.current = true;
        initController();
        startNewGameSession();
      })
      .catch((error) => console.warn(error));
  }, []);

  return <></>;
}

async function initController() {
  console.log("Init controller");
  const openApp = async (
    event?: overwolf.extensions.AppLaunchTriggeredEvent
  ) => {
    let userId = useAccountStore.getState().userId;
    if (event?.origin === "urlscheme") {
      const matchedUserId = decodeURIComponent(event.parameter).match(
        "userId=([^&]*)"
      );
      const newUserId = matchedUserId ? matchedUserId[1] : null;
      if (newUserId) {
        userId = newUserId;
      }
    }
    if (userId) {
      const accountStore = useAccountStore.getState();
      const response = await fetch(`${PATREON_BASE_URI}/api/patreon/overwolf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appId: "olbbpfjombddiijdbjeeegeclifleaifdeonllfd",
          userId,
        }),
      });
      try {
        const body = await response.json();
        if (!response.ok) {
          console.warn(body);
          accountStore.setIsPatron(false);
        } else {
          console.log(`Patreon successfully activated`);
          accountStore.setIsPatron(true, userId);
        }
      } catch (err) {
        console.error(err);
        accountStore.setIsPatron(false);
      }
    }

    const runningGameInfo = await getRunningGameInfo(GAME_CLASS_ID);
    if (runningGameInfo) {
      const preferedWindowName = await getPreferedWindowName();
      const windowId = await restoreWindow(preferedWindowName);
      if (preferedWindowName === WINDOWS.DESKTOP) {
        moveToOtherScreen(windowId, runningGameInfo.monitorHandle.value);
      }
    } else {
      restoreWindow(WINDOWS.DESKTOP);
    }
  };
  openApp();

  overwolf.extensions.onAppLaunchTriggered.addListener(openApp);

  overwolf.settings.hotkeys.onPressed.addListener(async (event) => {
    if (event.name === HOTKEYS.TOGGLE_APP) {
      const preferedWindowName = await getPreferedWindowName();
      toggleWindow(preferedWindowName);
    } else if (event.name === HOTKEYS.TOGGLE_LOCK_APP) {
      useSettingsStore.getState().toggleLockedWindow();
    }
  });

  overwolf.games.onGameInfoUpdated.addListener(async (event) => {
    if (event.runningChanged && event.gameInfo?.classId === GAME_CLASS_ID) {
      const preferedWindowName = await getPreferedWindowName();
      if (event.gameInfo.isRunning) {
        if (preferedWindowName === WINDOWS.OVERLAY) {
          restoreWindow(WINDOWS.OVERLAY);
          closeWindow(WINDOWS.DESKTOP);
        } else {
          restoreWindow(WINDOWS.DESKTOP);
          closeWindow(WINDOWS.OVERLAY);
        }
      } else if (preferedWindowName === WINDOWS.OVERLAY) {
        closeMainWindow();
      }
    }
  });
}
