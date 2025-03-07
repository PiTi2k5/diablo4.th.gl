import Cookies from "js-cookie";
import Script from "next/script";
import { useEffect, useState } from "react";
import { PATREON_BASE_URI } from "../lib/env";
import { useAccountStore } from "../lib/storage/account";
import TwitchEmbed from "./twitch-embed";

type NitroAds = {
  // eslint-disable-next-line no-unused-vars
  createAd: (id: string, options: any) => void;
  addUserToken: () => void;
  queue: ([string, any, (value: unknown) => void] | [string, any])[];
};

interface MyWindow extends Window {
  nitroAds: NitroAds;
}
declare let window: MyWindow;

window.nitroAds = window.nitroAds || {
  createAd: function () {
    return new Promise(function (e) {
      // eslint-disable-next-line prefer-rest-params
      window.nitroAds.queue.push(["createAd", arguments, e]);
    });
  },
  addUserToken: function () {
    // eslint-disable-next-line prefer-rest-params
    window.nitroAds.queue.push(["addUserToken", arguments]);
  },
  queue: [],
};

export default function NitroPay() {
  const accountStore = useAccountStore();
  const [showFallback, setShowFallback] = useState<boolean | null>(null);

  useEffect(() => {
    let userId = Cookies.get("userId");
    const refreshState = async () => {
      if (!userId) {
        const state = useAccountStore.getState();
        if (state.isPatron) {
          accountStore.setIsPatron(false);
        }
        return;
      }

      const response = await fetch(
        `${PATREON_BASE_URI}/api/patreon?appId=olbbpfjombddiijdbjeeegeclifleaifdeonllfd`,
        { credentials: "include" }
      );
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
    };
    refreshState();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const newUserId = Cookies.get("userId");
        if (newUserId !== userId) {
          userId = newUserId;
          refreshState();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (showFallback === false || accountStore.isPatron) {
      return;
    }
    const timeoutId = setTimeout(() => {
      setShowFallback(true);
    }, 1500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [showFallback]);

  if (accountStore.isPatron) {
    return <></>;
  }

  const handleLoad = () => {
    setShowFallback(false);
    window["nitroAds"].createAd("diablo4-video", {
      format: "video-nc",
    });
  };

  return (
    <>
      <Script
        src="https://s.nitropay.com/ads-1487.js"
        async
        data-cfasync="false"
        data-log-level="silent"
        onLoad={handleLoad}
        onError={() => setShowFallback(true)}
      />
      <div id="diablo4-video" className={showFallback ? "" : "w-full h-56"} />
      {showFallback && <TwitchEmbed onClose={() => setShowFallback(false)} />}
    </>
  );
}
