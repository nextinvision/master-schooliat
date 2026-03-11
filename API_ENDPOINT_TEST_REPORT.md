# Mobile API Endpoint Test Report

**Base URL:** https://api.schooliat.com
**Tested at:** 2026-03-11T12:55:48.924Z
**Authenticated:** No (protected endpoints returned 401)

## Summary

| Metric | Count |
|--------|-------|
| Total endpoints | 295 |
| Working (2xx) | 3 |
| Client errors (400/401/403/404) – endpoint reached | 292 |
| Failed (5xx or network) | 0 |

## Status code breakdown

| Status | Count |
|--------|-------|
| 200 | 3 |
| 400 | 2 |
| 401 | 290 |

## By group (success = 2xx or 4xx reached; fail = 5xx/ERR)

| Group | Total | OK (reached) | Failed |
|-------|-------|---------------|--------|
| ai | 7 | 7 | 0 |
| attendance | 7 | 7 | 0 |
| audit | 2 | 2 | 0 |
| authentication | 9 | 9 | 0 |
| calendar | 18 | 18 | 0 |
| circulars | 5 | 5 | 0 |
| communication | 7 | 7 | 0 |
| deletion-otp | 1 | 1 | 0 |
| emergency-contacts | 5 | 5 | 0 |
| employees | 6 | 6 | 0 |
| exams | 4 | 4 | 0 |
| fees | 7 | 7 | 0 |
| files | 2 | 2 | 0 |
| gallery | 7 | 7 | 0 |
| grievances | 6 | 6 | 0 |
| homework | 7 | 7 | 0 |
| id-cards | 5 | 5 | 0 |
| inventory | 4 | 4 | 0 |
| invoices | 6 | 6 | 0 |
| leave | 11 | 11 | 0 |
| letterhead | 2 | 2 | 0 |
| library | 13 | 13 | 0 |
| licenses | 5 | 5 | 0 |
| locations | 3 | 3 | 0 |
| marks | 9 | 9 | 0 |
| notes | 8 | 8 | 0 |
| notifications | 6 | 6 | 0 |
| parent | 4 | 4 | 0 |
| receipts | 6 | 6 | 0 |
| regions | 4 | 4 | 0 |
| reports | 5 | 5 | 0 |
| salary | 10 | 10 | 0 |
| schools | 12 | 12 | 0 |
| settings | 4 | 4 | 0 |
| statistics | 4 | 4 | 0 |
| students | 2 | 2 | 0 |
| subjects | 4 | 4 | 0 |
| syllabus | 5 | 5 | 0 |
| templates | 2 | 2 | 0 |
| timetables | 8 | 8 | 0 |
| transfer-certificates | 6 | 6 | 0 |
| transports | 15 | 15 | 0 |
| users | 26 | 26 | 0 |
| vendors | 6 | 6 | 0 |

## Conclusion

- **295** endpoints are **reachable** (returned 2xx or expected 4xx).
- Run with `MOBILE_API_EMAIL` and `MOBILE_API_PASSWORD` (e.g. teacher1@gis001.edu / Teacher@123) to test with auth and get more 2xx responses.
