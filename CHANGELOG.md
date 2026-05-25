# Changelog

## 0.9.0

Parity sync with the Python SDK, CI matrix expansion, and tightened error
handling for `getAvailableMetrics`.

### Added

- `DataMetric` now includes `renewable_proportion`.
- `DataSecondaryGrouping` now includes `status`.
- `UnitFueltechType` / `FuelTech` now include `other`, `solar`, `imports`,
  `exports`, `aggregator_vpp`, `aggregator_dr`.
- `UnitFueltechGroupType` / `FuelTechGroup` now include `renewable`,
  `fossil`, `other`.
- `UserPlan` now includes `COMMUNITY`.
- New `OpenNEMRoles` const + `OpenNEMRolesType` mirroring the Python enum.
- `IUser` gains optional `rate_limit`, `unkey_meta`, `roles`.
- `IAPIResponse.version` and `IAPIResponse.created_at` are now optional
  (matches the Python client's `OpennemUserResponse` fix in 0.10.x).
- Public re-exports for `RecordTable`, `IRecord`, `createNetworkDate`,
  `OpenNEMRoles`, `OpenNEMRolesType` from the package entry point.

### Fixed

- `getAvailableMetrics()` now uses the shared `request<T>` path, so 403,
  404, and 500 responses surface as `OpenElectricityError` / `NoDataFound`
  instead of a bare `Error`.
- `DataTable.fromNetworkTimeSeries` no longer throws when called with an
  empty `data` array (affected pollution / facility queries with no
  matching rows).

### Removed

- `src/config.ts` (duplicated `NETWORK_TIMEZONE_OFFSETS` and
  `getNetworkTimezoneOffset` from `datetime.ts`, not imported anywhere).

### CI

- Test matrix expanded to Node 18, 20, 22, 24 with `fail-fast: false`.
- New `test-bun` job runs the vitest suite under Bun latest to catch
  runtime-specific regressions.
- Coverage now runs once on Node 22 instead of every matrix entry.
- `concurrency: cancel-in-progress` so rapid pushes don't pile up.
- Duplicate `test.yml` and `lint.yml` workflows removed.

## 0.8.1

- `getFacilities` 404 now throws `NoDataFound`; new E2E tests.

## 0.8.0

- Renewable-with-storage market metrics, `hydro_and_storage` fueltech,
  Biome v2 migration.

## 0.7.1

- `unitCodes` param on `getFacilityData`; flow market metrics.

## 0.7.0

- `max_generation` / `max_generation_interval` on facility outputs;
  renewable proportion example.
