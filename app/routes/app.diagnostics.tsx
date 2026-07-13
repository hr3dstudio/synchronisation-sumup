import { useLoaderData } from "react-router";

type DiagnosticsData = {
  nodeEnv?: string;
  hasDatabaseUrl: boolean;
  hasSumupKey: boolean;
  dryRun: boolean;
};

export const loader = async (): Promise<DiagnosticsData> =>
  ({
    nodeEnv: process.env.NODE_ENV,
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasSumupKey: Boolean(process.env.SUMUP_API_KEY),
    dryRun: process.env.DRY_RUN !== "false",
  });

export default function Diagnostics() {
  const data = useLoaderData<typeof loader>() as DiagnosticsData;

  return (
    <s-page heading="Diagnostic">
      <s-section>
        <s-unordered-list>
          <s-list-item>Environnement : {data.nodeEnv}</s-list-item>
          <s-list-item>Base configuree : {data.hasDatabaseUrl ? "oui" : "non"}</s-list-item>
          <s-list-item>SumUp configure : {data.hasSumupKey ? "oui" : "non"}</s-list-item>
          <s-list-item>Simulation : {data.dryRun ? "active" : "inactive"}</s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}
