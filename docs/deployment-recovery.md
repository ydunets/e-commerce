# Immutable deployment and recovery

Use this procedure for production release approval, the first transition from tagged images, or a failed rollout. The workflow implementation is covered by deterministic tests. Production configuration and live recovery have not been verified during #98 implementation because the available Azure login cannot read the configured apps. Deployment requires the production environment's authorised identity; do not launch a release solely to complete ticket administration.

## Release identity and retention

The existing client, server and migrations build matrix and semantic-release train remain in place. The versioned GitHub Release remains the human-facing release identity. Each build additionally records its exact GHCR digest, source commit, workflow run and attempt in an `image-<app>-<run>-<attempt>` artifact. Deployment checks that all three records belong to the same source and attempt, including when semantic-release subsequently creates a changelog commit. Tags such as `latest` and package-version constants are not deployment inputs.

Build images receive `build-<commit>-<run>-<attempt>` retention tags. Before Azure changes, the workflow records both running predecessor revisions and immutable images, verifies that GHCR can copy those images, and adds `recovery-<run>-<attempt>-<role>` tags without rebuilding. The `predecessors-<run>-<attempt>` artifact must upload successfully before migrations begin. The `deployment-<run>-<attempt>` artifact records verified revisions, digests, probes, migration execution and any recovery outcome. No container environment values are included.

Artifacts are retained for 90 days. Keep the referenced GHCR manifests and their build/recovery tags for at least that period, and always retain the currently deployed and supported predecessor images even beyond it. Registry cleanup is a separate operator responsibility; deleting a manifest also invalidates its digest reference. Export receipts to durable storage before artifact expiry if a longer recovery window is required.

## First transition from `latest`

Azure's revision template can contain a tag rather than the digest actually pulled. The replica API exposes a container identifier, not a pulled-image digest. Looking up today's `latest`, or merely finding a plausible older build, does not establish the predecessor's identity.

1. Read the active traffic configuration and exact running revision using the production Azure identity. A healthy predecessor and one application container per app are required. Multiple mode is accepted only when one identifiable ready revision receives all traffic; split traffic is rejected before updates.
2. For each tagged predecessor, obtain evidence which binds that exact revision to the image digest actually deployed. Acceptable evidence is a trusted historical deployment receipt or platform pull evidence. A present-day registry tag lookup is insufficient. If no such evidence exists, stop and agree a separately authorised bootstrap/recovery plan; the workflow deliberately cannot invent the missing identity.
3. Set the production environment variable `PREDECESSOR_IMAGES` to a JSON object containing the verified entries. The following is a structural example, not deployable evidence:

```json
{
  "server": {
    "app": "ecommerce-server",
    "revision": "<actual-running-revision>",
    "image": "ghcr.io/ydunets/e-commerce/server@sha256:<64-hex-digest>",
    "evidence": "<durable reference to historical deployment or pull evidence>",
    "verifiedBy": "<responsible operator>"
  }
}
```

Provide the equivalent `client` entry when its predecessor is tagged. The workflow validates app, revision and digest format, but the operator is responsible for the evidence's authenticity. Once both apps run digest references, this variable is unnecessary and can be removed. Stale evidence cannot satisfy a different revision. The workflow rechecks predecessors after artifact upload and before migrations.

## Authorised rollout gates

Production runs are serialised, restricted to `main`, and subject to the existing `production` environment approval policy. Do not edit app configuration or run parallel manual deployments during a rollout.

1. Review database compatibility before approval. Migrations and seeds run first through the existing job, using the recorded migration digest. The specific execution must report that image and succeed. Failure or timeout prevents either application update. If execution state is uncertain, inspect its history before retrying.
2. Establish Single revision mode and apply HTTP Startup and Readiness probes to the server's `/health`, using the configured ingress target port. Probes run every five seconds, allow three seconds per response and thirty consecutive failures. Existing liveness probes, environment references, resources and scaling configuration are preserved.
3. Deploy the server as revision `r<run>-<attempt>`. Only the intended revision with the exact image, configured probes, `Provisioned` and `Healthy` status, and matching latest-ready identity can pass. Read-only health, product listing and product detail checks must pass on both its revision hostname and public app hostname before the client is updated. Scale-to-zero revisions receive read-only traffic while readiness is polled; those requests do not replace the gate.
4. Apply the same revision and digest gate to the client, with Startup and Readiness probes on `/`. Verify HTML page delivery, product listing and product details through its API proxy on both hostnames. These checks require an existing catalogue and externally reachable HTTPS ingress. They never create or modify production fixtures.

Azure Single mode retains traffic on the previous revision until the new revision is ready, as described in [Azure revision behaviour](https://learn.microsoft.com/en-us/azure/container-apps/revisions). HTTP verification occurs after platform readiness, so this does not guarantee zero faulty-response exposure. See [Azure health probes](https://learn.microsoft.com/en-us/azure/container-apps/health-probes) for platform semantics.

## Failure and recovery

A server rollout or verification failure creates a recovery revision from the recorded predecessor template and digest, with the required probes, then verifies that revision and its HTTP responses. The client is not deployed. A client failure restores and verifies only the client; the already verified server remains deployed. The release remains failed even when recovery succeeds. Recovery failure reports the affected app, predecessor digest and verification failure, requiring operator intervention.

Database migrations are never reversed automatically. Every migration and seed change must remain compatible with the previous server, which continues serving during migration and may be restored afterwards. Likewise, the new server must support the preceding client. Destructive schema changes require a separately approved staged migration plan, not an automatic image rollback.

For an interrupted runner or failed recovery:

1. Download the predecessor and deployment artifacts for the failed run. Confirm their source/run identities and the retained GHCR digests. Inspect Azure Activity Log, the named application revisions and the migration execution history. Treat an absent final receipt as an unknown outcome, not success.
2. Confirm which revision currently serves traffic and whether the database is compatible with the recorded predecessor. Obtain operator approval before additional mutations. A workflow rerun is a new attempt and must rebuild all three images; rerunning only failed jobs cannot reuse another attempt's records.
3. Restore the affected app from its recorded predecessor revision using the recorded digest. For an authorised manual restoration, `az containerapp revision copy --name <app> --resource-group <group> --from-revision <recorded-revision> --image <recorded-digest-reference> --revision-suffix <unique-recovery-suffix>` preserves its template. Inspect and establish Startup/Readiness probes and Single mode where necessary. If the predecessor revision was deleted, reconstruct its configuration from approved infrastructure records before attempting recovery.
4. Verify the exact recovery revision, digest, readiness, probes and read-only endpoints described above. Record the outcome and keep the original release failed. Do not update the unaffected tier or execute database down migrations as part of image recovery.

Run `pnpm check:deployment` for deterministic rollout, Azure-command and HTTP-boundary tests. It is included in `pnpm check`, so both existing validation jobs execute it. The final server-image PR smoke gate remains separate and unchanged. Passing these tests is not evidence that a production deployment occurred.
