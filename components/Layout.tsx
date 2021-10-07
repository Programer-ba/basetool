import { inProduction } from "@/lib/environment";
import { segment } from "@/lib/track";
import { useIntercom } from "react-use-intercom";
import { useProfile, useSidebarsVisible } from "@/hooks";
import { useRouter } from "next/router";
import Authenticated from "./Authenticated";
import DataSourcesSidebar from "./DataSourcesSidebar";
import Favicons from "./Favicons";
import Head from "next/head";
import PageWrapper from "./PageWrapper";
import React, { ReactNode, useEffect, useMemo } from "react";
import SettingsSidebar from "./OrganizationSidebar";
import Sidebar from "./Sidebar";
import classNames from "classnames";

function Layout({
  hideSidebar = false,
  children,
  sidebar,
}: {
  hideSidebar?: boolean;
  children: ReactNode;
  sidebar?: ReactNode;
}) {
  const router = useRouter();
  const { session, isLoading: profileIsLoading } = useProfile();
  const tablesSidebarVisible = useMemo(() => {
    if (sidebar) return false;
    if (hideSidebar) return false;

    return true;
  }, [router.pathname]);

  // temporarily returning false until we figure out a better way of injecting the sidebar with dynamic values 👇
  const settingsSidebarVisible = useMemo(
    () => false && router.pathname.includes("/settings"),
    [router.pathname]
  );
  const { boot, update } = useIntercom();

  useEffect(() => {
    // Boot up the Intercom widget
    if (inProduction) boot();
  }, []);

  useEffect(() => {
    // Update Intercom with the user's info
    if (inProduction && !profileIsLoading && session) {
      // Update Intercom identification
      update({
        name: session?.user?.name,
        email: session?.user?.email,
        createdAt: session?.user?.createdAt?.toString(),
        userHash: session?.user?.intercomUserHash,
      });

      // Update Segment identification
      segment().identify(undefined, {
        name: session?.user?.name,
        email: session?.user?.email,
      });
    }
  }, [profileIsLoading, session]);

  const [sidebarsVisible] = useSidebarsVisible();

  const meta = {
    name: 'basetool',
    separator: '·',
    description: 'All your data under the same roof',
    url: 'https://basetool.io',
    image: 'img/cover.jpg',
    twitter: {
      handle: '@basetool',
    }
  }
  const title = `${meta.name} ${meta.separator} ${meta.description}`
  const imagePath = `${meta.url}/${meta.image}`

  return (
    <Authenticated>
      <>
        <Head>
          <title>{title} 👋</title>
          <meta name="description" content={meta.description} />
          <meta name="twitter:title" content={title}/>
          <meta name="twitter:description" content={meta.description}/>
          <meta name="twitter:card" content="summary_large_image"/>
          <meta name="twitter:site" content={meta.twitter.handle}/>
          <meta name="twitter:image" content={imagePath}/>
          <meta property="og:title" content={title}/>
          <meta property="og:description" content={meta.description}/>
          <meta property="og:type" content="website"/>
          <meta property="og:url" content={meta.url}/>
          <meta property="og:image" content={imagePath}/>
          <meta property="og:image:width" content="1376"/>
          <meta property="og:image:height" content="604"/>
          <Favicons />
        </Head>
        <div className="antialiased flex w-screen h-screen">
          <DataSourcesSidebar />
          <div
            className={classNames(
              "flex-1 flex bg-cool-gray-100 rounded-tl-lg shadow h-[calc(100%-0.5rem)] my-2",
              {
                "w-[calc(100%-5rem)]": sidebarsVisible,
                "w-[calc(100%-0.5rem)] md:w-[calc(100%-5rem)]":
                  !sidebarsVisible,
              }
            )}
          >
            {(sidebar || tablesSidebarVisible || settingsSidebarVisible) && (
              <div
                className={classNames("flex", {
                  "min-w-[14rem] max-w-[14rem]": sidebarsVisible,
                  "w-0 md:min-w-[14rem] md:max-w-[14rem]": !sidebarsVisible,
                })}
              >
                {tablesSidebarVisible && <Sidebar />}
                {settingsSidebarVisible && <SettingsSidebar />}
                {sidebar}
              </div>
            )}
            <div className="flex-1 flex flex-col w-full h-full overflow-auto">
              <div className="relative flex flex-1 w-full max-h-full">
                {profileIsLoading && <PageWrapper isLoading={true} />}
                {profileIsLoading || children}
              </div>
            </div>
          </div>
        </div>
      </>
    </Authenticated>
  );
}

export default Layout;
