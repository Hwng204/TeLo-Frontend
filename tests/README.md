# Module API regression

Run `npm run test:module-api` from the frontend root. Uses the real API module
through Vite, an in-memory Axios adapter and a real HTTP server bound only to
`127.0.0.1` on a temporary port. No application backend or database is contacted.

Older DB v2 module responses may omit `version`. Module deletion must omit that
query parameter instead of sending the literal `version=undefined`, which ASP.NET
rejects during numeric model binding. Supplied revisions, including the full uint
range, must still be sent for the backend's concurrency checks. API conflicts must
continue to reject the operation.

This compatibility path targets the DB v2 backend, where an omitted delete
revision binds to zero and is supported. A backend requiring a revision still
rejects missing revisions; its validation is not bypassed.

The backend's HTTP binding/serialization checks are in
`TeLo-Backend-phucvm/Tests/WebAPI.Tests/ModulesControllerTests.cs`. Run from that
backend root:

```powershell
dotnet test Tests/WebAPI.Tests/WebAPI.Tests.csproj --filter FullyQualifiedName~ModulesControllerTests
```

These use ASP.NET TestServer with a module service stub, not a database. They
cover omitted/numeric/invalid query revisions, authentication, forwarding service
conflicts, and numeric revision fields in current list/detail JSON responses.
