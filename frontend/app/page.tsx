"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Client, { type monitor, site } from "@/app/lib/client";
import { type FC, useEffect, useState } from "react";
import { DateTime } from "luxon";

function App() {
  const [baseURL, setBaseURL] = useState("");
  useEffect(() => setBaseURL(window.location.origin), []);

  if (!baseURL) return null;

  return (
    <>
      <div className="container px-4 my-16 mx-auto min-h-full">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight sm:truncate">
          Uptime Monitoring
        </h2>

        <main className="pt-8 pb-16">
          <SiteList client={new Client(baseURL)} />
        </main>
      </div>
    </>
  );
}

const SiteList: FC<{ client: Client }> = ({ client }) => {
  const { isLoading, error, data } = useQuery({
    queryKey: ["sites"],
    queryFn: () => client.site.list(),
    refetchInterval: 10000, // 10s
    retry: false,
  });

  const { data: status } = useQuery({
    queryKey: ["status"],
    queryFn: () => client.monitor.status(),
    refetchInterval: 1000, // every second
    retry: false,
  });

  const queryClient = useQueryClient();

  const doDelete = useMutation({
    mutationFn: (site: site.Site) => {
      return client.site.del(site.id, { id: site.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div className="text-red-600">{(error as Error).message}</div>;
  }

  const now = DateTime.now();
  return (
    <>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">
            Monitored Websites
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all the websites being monitored, their current status,
            and when they were last checked.
          </p>
        </div>
        <div className="mt-4 sm:flex-none sm:mt-0 sm:ml-16">
          <AddSiteForm client={client} />
        </div>
      </div>

      <div className="flex flex-col mt-8">
        <div className="overflow-x-auto -my-2 -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="inline-block py-2 min-w-full align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden ring-1 ring-black ring-opacity-5 shadow md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 px-3 text-sm font-semibold text-left text-gray-900"
                    >
                      Site
                    </th>
                    <th
                      scope="col"
                      className="relative py-3.5 pr-4 pl-3 sm:pr-6"
                    >
                      <span className="sr-only" />
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.sites.length === 0 && (
                    <tr>
                      <td
                        colSpan={2}
                        className={"text-center text-gray-400 py-8"}
                      >
                        Nothing to monitor yet. Add a website to see it here.
                      </td>
                    </tr>
                  )}
                  {data?.sites.map((site) => {
                    const st = status?.sites.find((s) => s.id === site.id);
                    const dt = st && DateTime.fromISO(st.checkedAt);
                    return (
                      <tr key={site.id}>
                        <td className="py-4 px-3 text-sm">
                          <div className="flex gap-2 items-center">
                            <span className="text-gray-700">{site.url}</span>
                            <StatusBadge status={st} />
                          </div>
                          {dt && (
                            <div className="text-gray-400">
                              Last checked <TimeDelta dt={dt} />
                            </div>
                          )}
                        </td>
                        <td className="relative py-4 pr-4 pl-3 text-sm font-medium text-right whitespace-nowrap sm:pr-6">
                          <button
                            className="text-indigo-600 hover:text-indigo-900"
                            onClick={() => doDelete.mutate(site)}
                            type="button"
                          >
                            Delete<span className="sr-only"> {site.url}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const AddSiteForm: FC<{ client: Client }> = ({ client }) => {
  const [formOpen, setFormOpen] = useState(false);
  const [url, setUrl] = useState("");

  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: async (url: string) => {
      if (!validURL(url)) {
        return;
      }

      await client.site.add({ url });
      setFormOpen(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      queryClient.invalidateQueries({ queryKey: ["status"] });
      setUrl("");
    },
  });

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    save.mutate(url);
  };

  if (!formOpen) {
    return (
      <button
        type="button"
        className="inline-flex justify-center items-center py-2 px-4 text-sm font-medium text-white bg-indigo-600 rounded-md border border-transparent shadow-sm sm:w-auto hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
        onClick={() => setFormOpen(true)}
      >
        Add website
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="google.com"
            className="block p-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm sm:text-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 text-sm font-medium text-white bg-indigo-600 rounded-md border border-transparent shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-75 enabled:hover:bg-indigo-700"
            disabled={!validURL(url)}
          >
            Save
          </button>
        </div>
      </div>
    </form>
  );
};

export default App;

const validURL = (urlInput: string) => {
  const idx = urlInput.lastIndexOf(".");
  if (idx === -1 || urlInput.substring(idx + 1) === "") {
    return false;
  }

  let url = urlInput;
  if (!urlInput.startsWith("http:") && !urlInput.startsWith("https:")) {
    url = `https://${urlInput}`;
  }

  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch (_) {
    return false;
  }
};

const StatusBadge: FC<{ status: monitor.SiteStatus | undefined }> = ({
  status,
}) => {
  const up = status?.up;
  return up ? (
    <Badge color="green">Up</Badge>
  ) : up === false ? (
    <Badge color="red">Down</Badge>
  ) : (
    <Badge color="gray">Unknown</Badge>
  );
};

const Badge: FC<{
  color: "green" | "red" | "orange" | "gray";
  children?: React.ReactNode;
}> = ({ color, children }) => {
  const [bgColor, textColor] = {
    green: ["bg-green-100", "text-green-800"],
    red: ["bg-red-100", "text-red-800"],
    orange: ["bg-orange-100", "text-orange-800"],
    gray: ["bg-gray-100", "text-gray-800"],
  }[color];

  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-sm font-medium uppercase ${bgColor} ${textColor}`}
    >
      {children}
    </span>
  );
};

const TimeDelta: FC<{ dt: DateTime }> = ({ dt }) => {
  const compute = () => dt.toRelative();
  const [str, setStr] = useState(compute());

  useEffect(() => {
    const handler = () => setStr(compute());
    const timer = setInterval(handler, 1000);
    return () => clearInterval(timer);
  }, [dt]);

  return <>{str}</>;
};
