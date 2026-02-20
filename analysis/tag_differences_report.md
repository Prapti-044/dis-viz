# Tag Differences Between O2 and O3 Optimized Binaries

## Summary


| Metric                     | Value |
| -------------------------- | ----- |
| Total files analyzed       | 309   |
| Files with differences     | 121   |
| Lines with tags only in O2 | 160   |
| Lines with tags only in O3 | 323   |
| Lines with different tags  | 1279  |


## Tag Distribution Changes

### Tags more prevalent in O2 (missing from O3 on specific lines)


| Tag          | Lines |
| ------------ | ----- |
| MEMORY_WRITE | 403   |
| MEMORY_READ  | 221   |
| CALL         | 220   |
| VECTORIZED   | 106   |
| INLINE       | 59    |
| HOISTED      | 28    |


### Tags more prevalent in O3 (missing from O2 on specific lines)


| Tag          | Lines |
| ------------ | ----- |
| MEMORY_READ  | 488   |
| VECTORIZED   | 447   |
| MEMORY_WRITE | 347   |
| HOISTED      | 172   |
| INLINE       | 135   |
| CALL         | 86    |


## Detailed Per-File Differences

### src/common/RunParams.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags         |
| ---- | ------------ |
| 476  | MEMORY_WRITE |
| 783  | MEMORY_READ  |
| 814  | MEMORY_READ  |
| 845  | MEMORY_READ  |
| 876  | MEMORY_READ  |
| 2123 | VECTORIZED   |
| 2200 | MEMORY_READ  |
| 2207 | MEMORY_READ  |
| 2362 | MEMORY_READ  |
| 2369 | MEMORY_READ  |
| 2537 | VECTORIZED   |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                      |
| ---- | ------------------------- |
| 425  | HOISTED                   |
| 501  | MEMORY_WRITE, MEMORY_READ |
| 502  | MEMORY_WRITE              |
| 507  | MEMORY_WRITE, MEMORY_READ |
| 508  | MEMORY_WRITE              |
| 748  | INLINE                    |
| 905  | INLINE                    |
| 906  | MEMORY_WRITE              |
| 921  | HOISTED                   |
| 939  | HOISTED                   |
| 955  | HOISTED                   |
| 971  | HOISTED                   |
| 987  | HOISTED                   |
| 1125 | HOISTED                   |
| 1141 | HOISTED                   |
| 1157 | HOISTED                   |
| 1173 | HOISTED                   |
| 1245 | MEMORY_WRITE              |
| 2148 | MEMORY_WRITE              |
| 2199 | MEMORY_READ               |
| 2294 | MEMORY_WRITE              |
| 2361 | MEMORY_READ               |
| 2439 | MEMORY_WRITE              |
| 2515 | MEMORY_WRITE              |
| 2562 | MEMORY_WRITE              |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                 | O3 Tags                                  | Only in O2                      | Only in O3          |
| ---- | --------------------------------------- | ---------------------------------------- | ------------------------------- | ------------------- |
| 107  | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | -                   |
| 154  | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | -                   |
| 156  | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | -                   |
| 291  | INLINE                                  | MEMORY_READ, INLINE                      | -                               | MEMORY_READ         |
| 317  | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_WRITE, MEMORY_READ, INLINE        | CALL                            | INLINE              |
| 319  | MEMORY_WRITE, INLINE, CALL              | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | MEMORY_READ         |
| 320  | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 323  | MEMORY_WRITE, HOISTED                   | MEMORY_WRITE, HOISTED, MEMORY_READ       | -                               | MEMORY_READ         |
| 325  | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 326  | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | INLINE                                   | MEMORY_WRITE, MEMORY_READ, CALL | -                   |
| 330  | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | INLINE                                   | MEMORY_WRITE, MEMORY_READ, CALL | -                   |
| 331  | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | INLINE                                   | MEMORY_WRITE, MEMORY_READ, CALL | -                   |
| 336  | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | INLINE                                   | MEMORY_WRITE, MEMORY_READ, CALL | -                   |
| 337  | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | MEMORY_WRITE, INLINE, CALL               | MEMORY_READ                     | -                   |
| 409  | MEMORY_WRITE, CALL                      | INLINE                                   | MEMORY_WRITE, CALL              | INLINE              |
| 420  | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | INLINE              |
| 436  | MEMORY_WRITE, CALL                      | INLINE                                   | MEMORY_WRITE, CALL              | INLINE              |
| 448  | MEMORY_WRITE, CALL                      | INLINE                                   | MEMORY_WRITE, CALL              | INLINE              |
| 454  | MEMORY_WRITE, CALL                      | INLINE                                   | MEMORY_WRITE, CALL              | INLINE              |
| 471  | MEMORY_WRITE                            | MEMORY_WRITE, MEMORY_READ                | -                               | MEMORY_READ         |
| 474  | MEMORY_WRITE, CALL                      | INLINE                                   | MEMORY_WRITE, CALL              | INLINE              |
| 481  | MEMORY_WRITE, CALL                      | INLINE                                   | MEMORY_WRITE, CALL              | INLINE              |
| 494  | MEMORY_WRITE, CALL                      | INLINE                                   | MEMORY_WRITE, CALL              | INLINE              |
| 504  | MEMORY_WRITE                            | MEMORY_WRITE, MEMORY_READ                | -                               | MEMORY_READ         |
| 511  | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 517  | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 536  | MEMORY_WRITE, CALL                      | INLINE                                   | MEMORY_WRITE, CALL              | INLINE              |
| 542  | MEMORY_WRITE, CALL                      | INLINE                                   | MEMORY_WRITE, CALL              | INLINE              |
| 556  | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 561  | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 616  | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 619  | MEMORY_WRITE, CALL                      | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | MEMORY_READ, INLINE |
| 623  | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 705  | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 747  | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 755  | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 762  | MEMORY_WRITE                            | MEMORY_WRITE, MEMORY_READ                | -                               | MEMORY_READ         |
| 766  | MEMORY_WRITE                            | MEMORY_WRITE, MEMORY_READ                | -                               | MEMORY_READ         |
| 770  | MEMORY_WRITE                            | MEMORY_WRITE, MEMORY_READ                | -                               | MEMORY_READ         |
| 779  | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | INLINE              |
| 784  | MEMORY_READ, INLINE                     | INLINE                                   | MEMORY_READ                     | -                   |
| 787  | MEMORY_WRITE, CALL                      | INLINE                                   | MEMORY_WRITE, CALL              | INLINE              |
| 791  | MEMORY_WRITE, INLINE                    | MEMORY_WRITE, MEMORY_READ, INLINE        | -                               | MEMORY_READ         |
| 798  | MEMORY_WRITE, CALL                      | INLINE                                   | MEMORY_WRITE, CALL              | INLINE              |
| 810  | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | INLINE              |
| 815  | MEMORY_READ, INLINE                     | INLINE                                   | MEMORY_READ                     | -                   |
| 818  | MEMORY_WRITE, CALL                      | INLINE                                   | MEMORY_WRITE, CALL              | INLINE              |
| 822  | MEMORY_WRITE, INLINE                    | MEMORY_WRITE, MEMORY_READ, INLINE        | -                               | MEMORY_READ         |
| 829  | MEMORY_WRITE, CALL                      | INLINE                                   | MEMORY_WRITE, CALL              | INLINE              |
| 841  | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | INLINE              |
| 846  | MEMORY_READ, INLINE                     | INLINE                                   | MEMORY_READ                     | -                   |
| 849  | MEMORY_WRITE, CALL                      | INLINE                                   | MEMORY_WRITE, CALL              | INLINE              |
| 853  | MEMORY_WRITE, INLINE                    | MEMORY_WRITE, MEMORY_READ, INLINE        | -                               | MEMORY_READ         |
| 860  | MEMORY_WRITE, CALL                      | INLINE                                   | MEMORY_WRITE, CALL              | INLINE              |
| 872  | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | INLINE              |
| 880  | MEMORY_WRITE, CALL                      | INLINE                                   | MEMORY_WRITE, CALL              | INLINE              |
| 891  | MEMORY_WRITE, CALL                      | INLINE                                   | MEMORY_WRITE, CALL              | INLINE              |
| 904  | MEMORY_WRITE, CALL                      | INLINE                                   | MEMORY_WRITE, CALL              | INLINE              |
| 916  | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | INLINE              |
| 925  | MEMORY_WRITE                            | MEMORY_WRITE, MEMORY_READ                | -                               | MEMORY_READ         |
| 934  | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | INLINE              |
| 950  | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | INLINE              |
| 966  | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | INLINE              |
| 982  | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | INLINE              |
| 1027 | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | INLINE              |
| 1101 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1106 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1120 | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | INLINE              |
| 1136 | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | INLINE              |
| 1152 | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | INLINE              |
| 1168 | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | INLINE              |
| 1183 | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | INLINE              |
| 1186 | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | MEMORY_WRITE, MEMORY_READ, CALL          | INLINE                          | -                   |
| 1196 | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | INLINE              |
| 1199 | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | MEMORY_WRITE, MEMORY_READ, CALL          | INLINE                          | -                   |
| 1209 | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | INLINE              |
| 1224 | MEMORY_WRITE                            | MEMORY_WRITE, MEMORY_READ                | -                               | MEMORY_READ         |
| 1228 | MEMORY_WRITE                            | MEMORY_WRITE, MEMORY_READ                | -                               | MEMORY_READ         |
| 1237 | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | INLINE              |
| 1243 | MEMORY_WRITE, CALL                      | INLINE                                   | MEMORY_WRITE, CALL              | INLINE              |
| 1385 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1387 | MEMORY_WRITE, CALL                      | INLINE                                   | MEMORY_WRITE, CALL              | INLINE              |
| 1390 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1393 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1395 | MEMORY_WRITE, CALL                      | INLINE                                   | MEMORY_WRITE, CALL              | INLINE              |
| 1398 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1401 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1403 | MEMORY_WRITE, CALL                      | INLINE                                   | MEMORY_WRITE, CALL              | INLINE              |
| 1406 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1408 | MEMORY_WRITE, CALL                      | INLINE                                   | MEMORY_WRITE, CALL              | INLINE              |
| 1410 | MEMORY_WRITE, CALL                      | INLINE                                   | MEMORY_WRITE, CALL              | INLINE              |
| 1414 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1416 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1419 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1421 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1424 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1427 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1430 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1433 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1436 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1439 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1442 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1445 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1447 | MEMORY_WRITE, CALL                      | INLINE                                   | MEMORY_WRITE, CALL              | INLINE              |
| 1449 | MEMORY_WRITE, CALL                      | INLINE                                   | MEMORY_WRITE, CALL              | INLINE              |
| 1454 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1458 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1463 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1467 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1472 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1476 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1480 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1484 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1488 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1492 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1497 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1500 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1504 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1507 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1511 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1514 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1518 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1521 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1524 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1526 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1529 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1534 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1536 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1539 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1541 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1544 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1546 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1550 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1552 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1559 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1561 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1568 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1570 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1577 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1579 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1585 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1587 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1592 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1595 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1599 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1601 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1605 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1607 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1611 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1613 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1620 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1624 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1626 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1630 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1632 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1636 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1638 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 1832 | INLINE                                  | MEMORY_READ, INLINE                      | -                               | MEMORY_READ         |
| 2070 | MEMORY_WRITE, INLINE                    | MEMORY_WRITE, CALL                       | INLINE                          | CALL                |
| 2076 | MEMORY_WRITE, INLINE                    | MEMORY_WRITE, CALL                       | INLINE                          | CALL                |
| 2078 | MEMORY_WRITE, INLINE                    | MEMORY_WRITE, CALL                       | INLINE                          | CALL                |
| 2080 | MEMORY_WRITE, INLINE                    | MEMORY_WRITE, CALL                       | INLINE                          | CALL                |
| 2104 | VECTORIZED                              | MEMORY_READ                              | VECTORIZED                      | MEMORY_READ         |
| 2105 | VECTORIZED                              | MEMORY_READ                              | VECTORIZED                      | MEMORY_READ         |
| 2106 | VECTORIZED                              | MEMORY_READ                              | VECTORIZED                      | MEMORY_READ         |
| 2117 | VECTORIZED, INLINE                      | MEMORY_READ, INLINE                      | VECTORIZED                      | MEMORY_READ         |
| 2130 | MEMORY_READ, INLINE                     | INLINE                                   | MEMORY_READ                     | -                   |
| 2150 | MEMORY_READ, INLINE                     | INLINE                                   | MEMORY_READ                     | -                   |
| 2166 | MEMORY_READ                             | MEMORY_WRITE, MEMORY_READ                | -                               | MEMORY_WRITE        |
| 2169 | MEMORY_READ, INLINE                     | INLINE                                   | MEMORY_READ                     | -                   |
| 2176 | MEMORY_WRITE, CALL                      | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | MEMORY_READ, INLINE |
| 2201 | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | MEMORY_WRITE, INLINE, CALL               | MEMORY_READ                     | -                   |
| 2208 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 2233 | HOISTED                                 | MEMORY_WRITE, HOISTED                    | -                               | MEMORY_WRITE        |
| 2235 | HOISTED, INLINE                         | HOISTED, MEMORY_READ, INLINE             | -                               | MEMORY_READ         |
| 2236 | HOISTED, MEMORY_READ, INLINE            | HOISTED, INLINE                          | MEMORY_READ                     | -                   |
| 2261 | INLINE                                  | MEMORY_WRITE, INLINE                     | -                               | MEMORY_WRITE        |
| 2269 | VECTORIZED, INLINE                      | INLINE                                   | VECTORIZED                      | -                   |
| 2290 | MEMORY_WRITE, MEMORY_READ, INLINE       | MEMORY_READ, INLINE                      | MEMORY_WRITE                    | -                   |
| 2307 | MEMORY_WRITE, MEMORY_READ, INLINE       | MEMORY_READ, INLINE                      | MEMORY_WRITE                    | -                   |
| 2312 | MEMORY_READ                             | MEMORY_WRITE, MEMORY_READ                | -                               | MEMORY_WRITE        |
| 2323 | MEMORY_WRITE, INLINE, CALL              | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | MEMORY_READ         |
| 2338 | HOISTED                                 | MEMORY_WRITE, HOISTED                    | -                               | MEMORY_WRITE        |
| 2358 | MEMORY_WRITE, MEMORY_READ, INLINE       | MEMORY_READ, INLINE                      | MEMORY_WRITE                    | -                   |
| 2363 | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | MEMORY_WRITE, INLINE, CALL               | MEMORY_READ                     | -                   |
| 2370 | MEMORY_WRITE, INLINE, CALL              | INLINE                                   | MEMORY_WRITE, CALL              | -                   |
| 2393 | HOISTED                                 | MEMORY_WRITE, HOISTED                    | -                               | MEMORY_WRITE        |
| 2395 | HOISTED, INLINE                         | HOISTED, MEMORY_READ, INLINE             | -                               | MEMORY_READ         |
| 2457 | MEMORY_READ                             | MEMORY_WRITE, MEMORY_READ                | -                               | MEMORY_WRITE        |
| 2469 | MEMORY_WRITE, CALL                      | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | MEMORY_READ, INLINE |
| 2517 | MEMORY_READ, INLINE                     | INLINE                                   | MEMORY_READ                     | -                   |
| 2531 | INLINE                                  | MEMORY_READ, INLINE                      | -                               | MEMORY_READ         |
| 2533 | INLINE                                  | MEMORY_WRITE, INLINE                     | -                               | MEMORY_WRITE        |
| 2544 | MEMORY_READ, INLINE                     | INLINE                                   | MEMORY_READ                     | -                   |
| 2564 | MEMORY_READ, INLINE                     | INLINE                                   | MEMORY_READ                     | -                   |
| 2581 | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | -                   |
| 2583 | MEMORY_READ                             | MEMORY_WRITE, MEMORY_READ                | -                               | MEMORY_WRITE        |
| 2592 | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | INLINE              |
| 2616 | MEMORY_READ, INLINE                     | MEMORY_WRITE, MEMORY_READ, INLINE        | -                               | MEMORY_WRITE        |
| 2620 | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_WRITE, INLINE, CALL               | MEMORY_READ                     | INLINE              |
| 2621 | MEMORY_WRITE                            | MEMORY_WRITE, MEMORY_READ                | -                               | MEMORY_READ         |
| 2631 | VECTORIZED, INLINE                      | INLINE                                   | VECTORIZED                      | -                   |
| 2654 | MEMORY_READ, INLINE                     | MEMORY_WRITE, MEMORY_READ, INLINE        | -                               | MEMORY_WRITE        |
| 2662 | MEMORY_WRITE, CALL                      | MEMORY_WRITE, MEMORY_READ, CALL          | -                               | MEMORY_READ         |
| 2692 | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_READ, INLINE                      | MEMORY_WRITE, CALL              | INLINE              |
| 2731 | MEMORY_READ, INLINE                     | INLINE                                   | MEMORY_READ                     | -                   |
| 2732 | MEMORY_READ, INLINE                     | MEMORY_WRITE, MEMORY_READ, INLINE        | -                               | MEMORY_WRITE        |
| 2733 | MEMORY_READ, INLINE                     | HOISTED, MEMORY_READ, INLINE             | -                               | HOISTED             |
| 2734 | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_WRITE, HOISTED, MEMORY_READ, CALL | -                               | HOISTED             |
| 2739 | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_WRITE, HOISTED, MEMORY_READ, CALL | -                               | HOISTED             |
| 2746 | MEMORY_READ, INLINE                     | MEMORY_WRITE, MEMORY_READ, INLINE        | -                               | MEMORY_WRITE        |
| 2755 | MEMORY_READ, INLINE                     | MEMORY_WRITE, MEMORY_READ, INLINE        | -                               | MEMORY_WRITE        |


### src/common/Executor.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags                      |
| ---- | ------------------------- |
| 1004 | MEMORY_READ               |
| 1007 | MEMORY_READ               |
| 1045 | INLINE                    |
| 1323 | MEMORY_READ, INLINE       |
| 1592 | MEMORY_WRITE, MEMORY_READ |
| 2012 | MEMORY_READ               |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags         |
| ---- | ------------ |
| 1114 | MEMORY_READ  |
| 1115 | MEMORY_READ  |
| 1116 | MEMORY_READ  |
| 1119 | MEMORY_READ  |
| 1122 | MEMORY_READ  |
| 1125 | MEMORY_READ  |
| 1128 | MEMORY_READ  |
| 1131 | MEMORY_READ  |
| 1618 | MEMORY_READ  |
| 1752 | MEMORY_READ  |
| 1753 | MEMORY_READ  |
| 1755 | MEMORY_READ  |
| 1890 | MEMORY_WRITE |
| 1894 | MEMORY_WRITE |
| 1898 | MEMORY_WRITE |
| 1927 | MEMORY_WRITE |
| 1953 | MEMORY_READ  |
| 1958 | MEMORY_READ  |
| 1963 | MEMORY_READ  |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                          | O3 Tags                                 | Only in O2                      | Only in O3                      |
| ---- | ------------------------------------------------ | --------------------------------------- | ------------------------------- | ------------------------------- |
| 132  | MEMORY_WRITE                                     | MEMORY_READ                             | MEMORY_WRITE                    | MEMORY_READ                     |
| 152  | MEMORY_WRITE, MEMORY_READ, INLINE, CALL          | MEMORY_WRITE, MEMORY_READ, INLINE       | CALL                            | -                               |
| 165  | MEMORY_WRITE, MEMORY_READ                        | MEMORY_WRITE                            | MEMORY_READ                     | -                               |
| 166  | INLINE                                           | MEMORY_WRITE, INLINE                    | -                               | MEMORY_WRITE                    |
| 172  | INLINE                                           | HOISTED, INLINE                         | -                               | HOISTED                         |
| 233  | MEMORY_WRITE, MEMORY_READ, INLINE, CALL          | MEMORY_READ, INLINE                     | MEMORY_WRITE, CALL              | -                               |
| 240  | MEMORY_WRITE, INLINE                             | MEMORY_WRITE, VECTORIZED, INLINE        | -                               | VECTORIZED                      |
| 495  | MEMORY_WRITE, INLINE, CALL                       | INLINE                                  | MEMORY_WRITE, CALL              | -                               |
| 497  | MEMORY_WRITE, CALL                               | INLINE                                  | MEMORY_WRITE, CALL              | INLINE                          |
| 498  | MEMORY_WRITE, CALL                               | INLINE                                  | MEMORY_WRITE, CALL              | INLINE                          |
| 515  | MEMORY_WRITE, INLINE, CALL                       | MEMORY_WRITE, INLINE                    | CALL                            | -                               |
| 517  | MEMORY_WRITE, MEMORY_READ, INLINE, CALL          | INLINE                                  | MEMORY_WRITE, MEMORY_READ, CALL | -                               |
| 518  | MEMORY_WRITE, INLINE, CALL                       | INLINE                                  | MEMORY_WRITE, CALL              | -                               |
| 525  | MEMORY_WRITE, INLINE, CALL                       | INLINE                                  | MEMORY_WRITE, CALL              | -                               |
| 527  | MEMORY_WRITE, INLINE, CALL                       | INLINE                                  | MEMORY_WRITE, CALL              | -                               |
| 636  | MEMORY_READ, INLINE                              | INLINE                                  | MEMORY_READ                     | -                               |
| 677  | VECTORIZED, INLINE                               | MEMORY_WRITE, INLINE                    | VECTORIZED                      | MEMORY_WRITE                    |
| 917  | MEMORY_READ, INLINE                              | INLINE                                  | MEMORY_READ                     | -                               |
| 945  | INLINE                                           | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | -                               | MEMORY_WRITE, MEMORY_READ, CALL |
| 995  | MEMORY_WRITE, MEMORY_READ                        | MEMORY_READ, INLINE                     | MEMORY_WRITE                    | INLINE                          |
| 1017 | INLINE                                           | MEMORY_READ, INLINE                     | -                               | MEMORY_READ                     |
| 1071 | VECTORIZED, INLINE                               | INLINE                                  | VECTORIZED                      | -                               |
| 1084 | MEMORY_READ, INLINE                              | MEMORY_WRITE, MEMORY_READ, INLINE       | -                               | MEMORY_WRITE                    |
| 1095 | MEMORY_READ, INLINE                              | MEMORY_WRITE, MEMORY_READ, INLINE       | -                               | MEMORY_WRITE                    |
| 1099 | MEMORY_WRITE                                     | MEMORY_READ                             | MEMORY_WRITE                    | MEMORY_READ                     |
| 1100 | MEMORY_READ                                      | MEMORY_READ, INLINE                     | -                               | INLINE                          |
| 1101 | INLINE                                           | MEMORY_READ, INLINE                     | -                               | MEMORY_READ                     |
| 1117 | INLINE                                           | MEMORY_WRITE, MEMORY_READ, INLINE       | -                               | MEMORY_WRITE, MEMORY_READ       |
| 1120 | INLINE                                           | MEMORY_WRITE, MEMORY_READ, INLINE       | -                               | MEMORY_WRITE, MEMORY_READ       |
| 1123 | INLINE                                           | MEMORY_WRITE, MEMORY_READ, INLINE       | -                               | MEMORY_WRITE, MEMORY_READ       |
| 1126 | INLINE                                           | MEMORY_WRITE, MEMORY_READ, INLINE       | -                               | MEMORY_WRITE, MEMORY_READ       |
| 1129 | INLINE                                           | MEMORY_WRITE, MEMORY_READ, INLINE       | -                               | MEMORY_WRITE, MEMORY_READ       |
| 1132 | INLINE                                           | MEMORY_WRITE, MEMORY_READ, INLINE       | -                               | MEMORY_WRITE, MEMORY_READ       |
| 1157 | INLINE                                           | MEMORY_READ, INLINE                     | -                               | MEMORY_READ                     |
| 1158 | HOISTED, INLINE                                  | HOISTED, MEMORY_READ, INLINE            | -                               | MEMORY_READ                     |
| 1235 | MEMORY_WRITE, MEMORY_READ, INLINE, CALL          | INLINE                                  | MEMORY_WRITE, MEMORY_READ, CALL | -                               |
| 1250 | MEMORY_READ, INLINE                              | MEMORY_WRITE, MEMORY_READ, INLINE       | -                               | MEMORY_WRITE                    |
| 1262 | MEMORY_WRITE, INLINE, CALL                       | MEMORY_WRITE, CALL                      | INLINE                          | -                               |
| 1285 | MEMORY_WRITE, MEMORY_READ, INLINE, CALL          | INLINE                                  | MEMORY_WRITE, MEMORY_READ, CALL | -                               |
| 1304 | MEMORY_WRITE, CALL                               | INLINE                                  | MEMORY_WRITE, CALL              | INLINE                          |
| 1319 | MEMORY_WRITE, CALL                               | MEMORY_READ, INLINE                     | MEMORY_WRITE, CALL              | MEMORY_READ, INLINE             |
| 1320 | MEMORY_WRITE, CALL                               | MEMORY_WRITE, INLINE                    | CALL                            | INLINE                          |
| 1321 | MEMORY_WRITE, CALL                               | MEMORY_WRITE, INLINE                    | CALL                            | INLINE                          |
| 1325 | MEMORY_READ, INLINE                              | INLINE                                  | MEMORY_READ                     | -                               |
| 1336 | MEMORY_READ, MEMORY_WRITE, HOISTED, INLINE, CALL | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | HOISTED                         | -                               |
| 1337 | INLINE                                           | MEMORY_READ, INLINE                     | -                               | MEMORY_READ                     |
| 1338 | MEMORY_WRITE, INLINE                             | INLINE                                  | MEMORY_WRITE                    | -                               |
| 1450 | INLINE                                           | MEMORY_READ                             | INLINE                          | MEMORY_READ                     |
| 1457 | MEMORY_WRITE, MEMORY_READ                        | MEMORY_WRITE, MEMORY_READ, INLINE       | -                               | INLINE                          |
| 1464 | VECTORIZED, INLINE                               | MEMORY_WRITE, VECTORIZED, INLINE, CALL  | -                               | MEMORY_WRITE, CALL              |
| 1467 | MEMORY_READ, INLINE                              | INLINE                                  | MEMORY_READ                     | -                               |
| 1476 | MEMORY_WRITE, MEMORY_READ, INLINE                | MEMORY_READ, INLINE                     | MEMORY_WRITE                    | -                               |
| 1515 | MEMORY_READ, INLINE                              | MEMORY_READ                             | INLINE                          | -                               |
| 1534 | MEMORY_READ                                      | MEMORY_WRITE, MEMORY_READ               | -                               | MEMORY_WRITE                    |
| 1536 | MEMORY_READ, INLINE                              | INLINE                                  | MEMORY_READ                     | -                               |
| 1544 | MEMORY_WRITE, MEMORY_READ                        | MEMORY_READ                             | MEMORY_WRITE                    | -                               |
| 1546 | MEMORY_READ, INLINE                              | MEMORY_READ                             | INLINE                          | -                               |
| 1548 | MEMORY_WRITE, MEMORY_READ, INLINE                | MEMORY_READ, INLINE                     | MEMORY_WRITE                    | -                               |
| 1567 | MEMORY_READ, INLINE                              | MEMORY_WRITE, INLINE                    | MEMORY_READ                     | MEMORY_WRITE                    |
| 1747 | MEMORY_WRITE, CALL                               | INLINE                                  | MEMORY_WRITE, CALL              | INLINE                          |
| 1748 | MEMORY_WRITE, CALL                               | INLINE                                  | MEMORY_WRITE, CALL              | INLINE                          |
| 1749 | MEMORY_WRITE, CALL                               | INLINE                                  | MEMORY_WRITE, CALL              | INLINE                          |
| 1750 | MEMORY_WRITE, CALL                               | INLINE                                  | MEMORY_WRITE, CALL              | INLINE                          |
| 1778 | INLINE                                           | MEMORY_READ, INLINE                     | -                               | MEMORY_READ                     |
| 1833 | MEMORY_READ, INLINE                              | INLINE                                  | MEMORY_READ                     | -                               |
| 1873 | INLINE                                           | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | -                               | MEMORY_WRITE, MEMORY_READ, CALL |
| 1891 | MEMORY_WRITE, CALL                               | MEMORY_WRITE, INLINE                    | CALL                            | INLINE                          |
| 1895 | MEMORY_WRITE, CALL                               | MEMORY_WRITE, INLINE                    | CALL                            | INLINE                          |
| 1899 | MEMORY_WRITE, INLINE, CALL                       | MEMORY_WRITE, INLINE                    | CALL                            | -                               |
| 1902 | MEMORY_WRITE, INLINE, CALL                       | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | -                               | MEMORY_READ                     |
| 1944 | MEMORY_WRITE, MEMORY_READ, INLINE, CALL          | MEMORY_WRITE, INLINE, CALL              | MEMORY_READ                     | -                               |
| 1954 | INLINE                                           | MEMORY_READ, INLINE                     | -                               | MEMORY_READ                     |
| 1959 | INLINE                                           | MEMORY_READ, INLINE                     | -                               | MEMORY_READ                     |
| 1994 | MEMORY_WRITE, MEMORY_READ                        | MEMORY_READ                             | MEMORY_WRITE                    | -                               |
| 2005 | MEMORY_READ, INLINE                              | MEMORY_WRITE, MEMORY_READ, INLINE       | -                               | MEMORY_WRITE                    |


### src/apps/mixed_fem_helper.hpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags                                  |
| ---- | ------------------------------------- |
| 305  | HOISTED                               |
| 645  | VECTORIZED                            |
| 652  | MEMORY_WRITE, VECTORIZED              |
| 653  | VECTORIZED                            |
| 654  | VECTORIZED                            |
| 655  | VECTORIZED                            |
| 656  | VECTORIZED                            |
| 657  | VECTORIZED                            |
| 658  | VECTORIZED                            |
| 659  | VECTORIZED                            |
| 660  | VECTORIZED                            |
| 661  | VECTORIZED                            |
| 662  | VECTORIZED                            |
| 663  | VECTORIZED                            |
| 668  | VECTORIZED                            |
| 675  | VECTORIZED                            |
| 676  | VECTORIZED                            |
| 677  | VECTORIZED                            |
| 678  | VECTORIZED                            |
| 679  | MEMORY_WRITE, MEMORY_READ, VECTORIZED |
| 680  | VECTORIZED                            |
| 681  | VECTORIZED                            |
| 682  | VECTORIZED                            |
| 683  | VECTORIZED                            |
| 684  | VECTORIZED                            |
| 685  | VECTORIZED                            |
| 686  | VECTORIZED                            |
| 691  | MEMORY_WRITE, VECTORIZED              |
| 698  | MEMORY_WRITE, VECTORIZED              |
| 699  | MEMORY_WRITE, VECTORIZED              |
| 700  | MEMORY_WRITE, VECTORIZED              |
| 701  | MEMORY_WRITE, VECTORIZED              |
| 702  | MEMORY_WRITE, VECTORIZED              |
| 703  | MEMORY_WRITE, VECTORIZED              |
| 704  | MEMORY_WRITE, VECTORIZED              |
| 705  | MEMORY_WRITE, VECTORIZED              |
| 706  | MEMORY_WRITE, VECTORIZED              |
| 707  | MEMORY_WRITE, VECTORIZED              |
| 708  | MEMORY_WRITE, VECTORIZED              |
| 709  | MEMORY_WRITE, VECTORIZED              |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                             |
| ---- | -------------------------------- |
| 243  | MEMORY_WRITE, VECTORIZED         |
| 299  | HOISTED, VECTORIZED, MEMORY_READ |
| 300  | HOISTED, VECTORIZED, MEMORY_READ |
| 301  | HOISTED, VECTORIZED, MEMORY_READ |
| 769  | VECTORIZED, MEMORY_READ          |
| 770  | VECTORIZED, MEMORY_READ          |
| 771  | VECTORIZED, MEMORY_READ          |
| 772  | VECTORIZED, MEMORY_READ          |
| 812  | VECTORIZED                       |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                        | Only in O2   | Only in O3                            |
| ---- | ------------------------------------- | ---------------------------------------------- | ------------ | ------------------------------------- |
| 261  | MEMORY_WRITE, VECTORIZED              | MEMORY_WRITE, MEMORY_READ, VECTORIZED          | -            | MEMORY_READ                           |
| 264  | MEMORY_WRITE, HOISTED, VECTORIZED     | MEMORY_WRITE, HOISTED, MEMORY_READ, VECTORIZED | -            | MEMORY_READ                           |
| 265  | MEMORY_WRITE, HOISTED, VECTORIZED     | MEMORY_WRITE, HOISTED, MEMORY_READ, VECTORIZED | -            | MEMORY_READ                           |
| 289  | MEMORY_WRITE, MEMORY_READ             | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -            | VECTORIZED                            |
| 297  | HOISTED                               | MEMORY_WRITE, HOISTED, MEMORY_READ, VECTORIZED | -            | MEMORY_WRITE, MEMORY_READ, VECTORIZED |
| 307  | MEMORY_WRITE, HOISTED, VECTORIZED     | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -            | MEMORY_READ                           |
| 319  | VECTORIZED                            | MEMORY_READ, VECTORIZED                        | -            | MEMORY_READ                           |
| 327  | VECTORIZED                            | MEMORY_READ, VECTORIZED                        | -            | MEMORY_READ                           |
| 329  | MEMORY_WRITE, MEMORY_READ, VECTORIZED | MEMORY_READ, VECTORIZED                        | MEMORY_WRITE | -                                     |
| 373  | VECTORIZED, INLINE                    | MEMORY_READ, VECTORIZED, INLINE                | -            | MEMORY_READ                           |
| 377  | VECTORIZED                            | MEMORY_READ, VECTORIZED                        | -            | MEMORY_READ                           |
| 381  | VECTORIZED, MEMORY_READ               | VECTORIZED                                     | MEMORY_READ  | -                                     |
| 389  | VECTORIZED                            | VECTORIZED, MEMORY_READ                        | -            | MEMORY_READ                           |
| 474  | VECTORIZED, MEMORY_READ               | VECTORIZED                                     | MEMORY_READ  | -                                     |
| 522  | VECTORIZED, MEMORY_READ               | VECTORIZED                                     | MEMORY_READ  | -                                     |
| 714  | VECTORIZED, MEMORY_READ               | MEMORY_WRITE, VECTORIZED                       | MEMORY_READ  | MEMORY_WRITE                          |
| 719  | VECTORIZED, MEMORY_READ               | MEMORY_WRITE, VECTORIZED                       | MEMORY_READ  | MEMORY_WRITE                          |
| 720  | VECTORIZED, MEMORY_READ               | MEMORY_WRITE, VECTORIZED                       | MEMORY_READ  | MEMORY_WRITE                          |
| 721  | VECTORIZED, MEMORY_READ               | MEMORY_WRITE, VECTORIZED                       | MEMORY_READ  | MEMORY_WRITE                          |
| 722  | VECTORIZED, MEMORY_READ               | MEMORY_WRITE, VECTORIZED                       | MEMORY_READ  | MEMORY_WRITE                          |
| 723  | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, VECTORIZED                       | MEMORY_READ  | -                                     |
| 724  | VECTORIZED, MEMORY_READ               | MEMORY_WRITE, VECTORIZED                       | MEMORY_READ  | MEMORY_WRITE                          |
| 725  | VECTORIZED, MEMORY_READ               | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -            | MEMORY_WRITE                          |
| 726  | VECTORIZED, MEMORY_READ               | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -            | MEMORY_WRITE                          |
| 727  | MEMORY_WRITE, VECTORIZED              | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE | MEMORY_READ                           |
| 728  | MEMORY_WRITE, VECTORIZED              | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE | MEMORY_READ                           |
| 729  | MEMORY_WRITE, VECTORIZED              | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE | MEMORY_READ                           |
| 730  | MEMORY_WRITE, VECTORIZED              | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE | MEMORY_READ                           |
| 735  | MEMORY_WRITE, VECTORIZED              | VECTORIZED                                     | MEMORY_WRITE | -                                     |
| 761  | MEMORY_WRITE, MEMORY_READ, VECTORIZED | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE | -                                     |
| 763  | VECTORIZED                            | VECTORIZED, MEMORY_READ                        | -            | MEMORY_READ                           |
| 764  | MEMORY_READ, VECTORIZED               | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -            | MEMORY_WRITE                          |
| 765  | VECTORIZED                            | VECTORIZED, MEMORY_READ                        | -            | MEMORY_READ                           |
| 766  | VECTORIZED                            | VECTORIZED, MEMORY_READ                        | -            | MEMORY_READ                           |
| 767  | VECTORIZED                            | VECTORIZED, MEMORY_READ                        | -            | MEMORY_READ                           |
| 768  | VECTORIZED                            | VECTORIZED, MEMORY_READ                        | -            | MEMORY_READ                           |
| 830  | INLINE                                | VECTORIZED, INLINE                             | -            | VECTORIZED                            |
| 839  | VECTORIZED                            | MEMORY_READ, VECTORIZED                        | -            | MEMORY_READ                           |


### src/apps/DIFFUSION3DPA-Seq.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags         |
| ---- | ------------ |
| 85   | MEMORY_WRITE |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                                  |
| ---- | ------------------------------------- |
| 41   | MEMORY_WRITE, VECTORIZED, MEMORY_READ |
| 54   | VECTORIZED, MEMORY_READ               |
| 55   | MEMORY_WRITE, VECTORIZED, MEMORY_READ |
| 64   | VECTORIZED, MEMORY_READ               |
| 78   | MEMORY_WRITE, VECTORIZED, MEMORY_READ |
| 79   | MEMORY_WRITE, VECTORIZED, MEMORY_READ |
| 100  | MEMORY_READ                           |
| 101  | VECTORIZED, MEMORY_READ               |
| 149  | VECTORIZED, MEMORY_READ               |
| 151  | VECTORIZED, MEMORY_READ               |
| 162  | MEMORY_WRITE, VECTORIZED              |
| 164  | MEMORY_WRITE, VECTORIZED, INLINE      |
| 165  | MEMORY_WRITE, VECTORIZED              |
| 180  | VECTORIZED, MEMORY_READ               |
| 182  | VECTORIZED, MEMORY_READ, INLINE       |
| 183  | VECTORIZED, MEMORY_READ               |
| 185  | VECTORIZED, MEMORY_READ               |
| 203  | MEMORY_READ, VECTORIZED               |
| 205  | MEMORY_READ, VECTORIZED               |
| 221  | VECTORIZED, MEMORY_READ               |
| 234  | VECTORIZED, MEMORY_READ               |
| 237  | VECTORIZED, MEMORY_READ               |
| 239  | MEMORY_WRITE, VECTORIZED, MEMORY_READ |
| 241  | MEMORY_WRITE, VECTORIZED, MEMORY_READ |
| 252  | VECTORIZED                            |
| 254  | VECTORIZED, INLINE                    |
| 257  | VECTORIZED, MEMORY_READ               |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                       | Only in O2            | Only in O3                            |
| ---- | ------------------------------------- | --------------------------------------------- | --------------------- | ------------------------------------- |
| 35   | MEMORY_WRITE, HOISTED, MEMORY_READ    | HOISTED, MEMORY_READ                          | MEMORY_WRITE          | -                                     |
| 39   | MEMORY_READ                           | MEMORY_WRITE, VECTORIZED, MEMORY_READ         | -                     | MEMORY_WRITE, VECTORIZED              |
| 40   | VECTORIZED, MEMORY_READ               | MEMORY_WRITE, VECTORIZED, MEMORY_READ         | -                     | MEMORY_WRITE                          |
| 53   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | VECTORIZED, MEMORY_READ                       | MEMORY_WRITE          | -                                     |
| 62   | MEMORY_WRITE, MEMORY_READ             | MEMORY_WRITE, VECTORIZED, MEMORY_READ         | -                     | VECTORIZED                            |
| 63   | MEMORY_WRITE                          | VECTORIZED, MEMORY_READ                       | MEMORY_WRITE          | VECTORIZED, MEMORY_READ               |
| 71   | MEMORY_WRITE, MEMORY_READ             | VECTORIZED, MEMORY_READ                       | MEMORY_WRITE          | VECTORIZED                            |
| 72   | MEMORY_WRITE, MEMORY_READ             | VECTORIZED, MEMORY_READ                       | MEMORY_WRITE          | VECTORIZED                            |
| 84   | VECTORIZED, MEMORY_READ               | MEMORY_WRITE, MEMORY_READ, VECTORIZED         | -                     | MEMORY_WRITE                          |
| 86   | MEMORY_WRITE                          | VECTORIZED, MEMORY_READ                       | MEMORY_WRITE          | VECTORIZED, MEMORY_READ               |
| 92   | MEMORY_WRITE, HOISTED, MEMORY_READ    | MEMORY_READ                                   | MEMORY_WRITE, HOISTED | -                                     |
| 93   | MEMORY_WRITE, MEMORY_READ             | VECTORIZED, MEMORY_READ                       | MEMORY_WRITE          | VECTORIZED                            |
| 142  | MEMORY_READ                           | VECTORIZED, MEMORY_READ                       | -                     | VECTORIZED                            |
| 144  | MEMORY_READ                           | VECTORIZED, MEMORY_READ                       | -                     | VECTORIZED                            |
| 146  | MEMORY_READ, INLINE                   | VECTORIZED, MEMORY_READ, INLINE               | -                     | VECTORIZED                            |
| 150  | INLINE                                | VECTORIZED, MEMORY_READ, INLINE               | -                     | VECTORIZED, MEMORY_READ               |
| 166  | INLINE                                | MEMORY_WRITE, VECTORIZED, INLINE              | -                     | MEMORY_WRITE, VECTORIZED              |
| 167  | VECTORIZED, MEMORY_READ               | MEMORY_WRITE, VECTORIZED                      | MEMORY_READ           | MEMORY_WRITE                          |
| 168  | VECTORIZED, MEMORY_READ, INLINE       | MEMORY_WRITE, VECTORIZED, INLINE              | MEMORY_READ           | MEMORY_WRITE                          |
| 169  | VECTORIZED, MEMORY_READ               | MEMORY_WRITE, MEMORY_READ, VECTORIZED         | -                     | MEMORY_WRITE                          |
| 184  | INLINE                                | VECTORIZED, MEMORY_READ, INLINE               | -                     | VECTORIZED, MEMORY_READ               |
| 186  | INLINE                                | VECTORIZED, MEMORY_READ, INLINE               | -                     | VECTORIZED, MEMORY_READ               |
| 187  | VECTORIZED, MEMORY_READ               | MEMORY_WRITE, VECTORIZED, MEMORY_READ         | -                     | MEMORY_WRITE                          |
| 204  | INLINE                                | MEMORY_READ, VECTORIZED, INLINE               | -                     | MEMORY_READ, VECTORIZED               |
| 219  | MEMORY_READ                           | VECTORIZED, MEMORY_READ                       | -                     | VECTORIZED                            |
| 220  | MEMORY_READ, INLINE                   | VECTORIZED, MEMORY_READ, INLINE               | -                     | VECTORIZED                            |
| 222  | INLINE                                | VECTORIZED, MEMORY_READ, INLINE               | -                     | VECTORIZED, MEMORY_READ               |
| 223  | VECTORIZED                            | VECTORIZED, MEMORY_READ                       | -                     | MEMORY_READ                           |
| 236  | INLINE                                | VECTORIZED, MEMORY_READ, INLINE               | -                     | VECTORIZED, MEMORY_READ               |
| 238  | INLINE                                | VECTORIZED, MEMORY_READ, INLINE               | -                     | VECTORIZED, MEMORY_READ               |
| 240  | INLINE                                | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE | -                     | MEMORY_WRITE, VECTORIZED, MEMORY_READ |
| 258  | INLINE                                | VECTORIZED, MEMORY_READ, INLINE               | -                     | VECTORIZED, MEMORY_READ               |
| 259  | VECTORIZED                            | VECTORIZED, MEMORY_READ                       | -                     | MEMORY_READ                           |
| 275  | VECTORIZED                            | VECTORIZED, MEMORY_READ                       | -                     | MEMORY_READ                           |
| 276  | VECTORIZED, INLINE                    | VECTORIZED, MEMORY_READ, INLINE               | -                     | MEMORY_READ                           |
| 277  | VECTORIZED                            | VECTORIZED, MEMORY_READ                       | -                     | MEMORY_READ                           |
| 291  | HOISTED                               | HOISTED, VECTORIZED, MEMORY_READ              | -                     | VECTORIZED, MEMORY_READ               |
| 292  | HOISTED, INLINE                       | HOISTED, VECTORIZED, MEMORY_READ, INLINE      | -                     | VECTORIZED, MEMORY_READ               |
| 293  | HOISTED, VECTORIZED                   | HOISTED, MEMORY_READ, VECTORIZED              | -                     | MEMORY_READ                           |
| 294  | HOISTED, VECTORIZED, INLINE           | HOISTED, MEMORY_READ, VECTORIZED, INLINE      | -                     | MEMORY_READ                           |
| 295  | HOISTED, VECTORIZED                   | HOISTED, MEMORY_READ, VECTORIZED              | -                     | MEMORY_READ                           |


### src/apps/CONVECTION3DPA-Seq.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags                      |
| ---- | ------------------------- |
| 71   | MEMORY_WRITE, MEMORY_READ |
| 216  | MEMORY_WRITE              |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                                  |
| ---- | ------------------------------------- |
| 40   | MEMORY_WRITE, VECTORIZED, MEMORY_READ |
| 51   | VECTORIZED, MEMORY_READ               |
| 84   | VECTORIZED, MEMORY_READ               |
| 93   | VECTORIZED, MEMORY_READ               |
| 117  | VECTORIZED, MEMORY_READ               |
| 157  | MEMORY_READ                           |
| 159  | MEMORY_READ                           |
| 164  | VECTORIZED, MEMORY_READ               |
| 166  | VECTORIZED, MEMORY_READ               |
| 177  | MEMORY_WRITE, VECTORIZED              |
| 179  | MEMORY_WRITE, VECTORIZED, INLINE      |
| 182  | VECTORIZED, MEMORY_READ               |
| 184  | VECTORIZED, MEMORY_READ               |
| 202  | VECTORIZED, MEMORY_READ               |
| 236  | VECTORIZED, MEMORY_READ               |
| 252  | VECTORIZED, MEMORY_READ               |
| 254  | VECTORIZED, MEMORY_READ               |
| 270  | HOISTED, MEMORY_READ, VECTORIZED      |
| 292  | VECTORIZED, MEMORY_READ               |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                        | Only in O2               | Only in O3                       |
| ---- | ------------------------------------- | ---------------------------------------------- | ------------------------ | -------------------------------- |
| 20   | MEMORY_WRITE, INLINE                  | MEMORY_READ, INLINE                            | MEMORY_WRITE             | MEMORY_READ                      |
| 38   | VECTORIZED, MEMORY_READ               | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -                        | MEMORY_WRITE                     |
| 49   | MEMORY_WRITE                          | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE             | VECTORIZED, MEMORY_READ          |
| 53   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, MEMORY_READ, VECTORIZED | -                        | HOISTED                          |
| 60   | MEMORY_WRITE, MEMORY_READ             | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE             | VECTORIZED                       |
| 62   | MEMORY_READ                           | VECTORIZED, MEMORY_READ                        | -                        | VECTORIZED                       |
| 69   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_READ                                    | MEMORY_WRITE, VECTORIZED | -                                |
| 73   | MEMORY_READ                           | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -                        | MEMORY_WRITE, VECTORIZED         |
| 80   | MEMORY_READ                           | MEMORY_READ, VECTORIZED                        | -                        | VECTORIZED                       |
| 82   | MEMORY_WRITE                          | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE             | VECTORIZED, MEMORY_READ          |
| 91   | VECTORIZED, MEMORY_READ               | MEMORY_READ                                    | VECTORIZED               | -                                |
| 95   | VECTORIZED                            | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -                        | MEMORY_WRITE, MEMORY_READ        |
| 102  | MEMORY_WRITE, HOISTED, MEMORY_READ    | MEMORY_READ, VECTORIZED                        | MEMORY_WRITE, HOISTED    | VECTORIZED                       |
| 104  | MEMORY_WRITE, MEMORY_READ             | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE             | VECTORIZED                       |
| 106  | VECTORIZED                            | VECTORIZED, MEMORY_READ                        | -                        | MEMORY_READ                      |
| 108  | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -                        | HOISTED                          |
| 115  | MEMORY_WRITE                          | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE             | VECTORIZED, MEMORY_READ          |
| 119  | MEMORY_WRITE, MEMORY_READ, VECTORIZED | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -                        | HOISTED                          |
| 161  | INLINE                                | MEMORY_READ, INLINE                            | -                        | MEMORY_READ                      |
| 165  | INLINE                                | VECTORIZED, MEMORY_READ, INLINE                | -                        | VECTORIZED, MEMORY_READ          |
| 183  | INLINE                                | VECTORIZED, MEMORY_READ, INLINE                | -                        | VECTORIZED, MEMORY_READ          |
| 200  | MEMORY_READ                           | VECTORIZED, MEMORY_READ                        | -                        | VECTORIZED                       |
| 201  | MEMORY_READ, INLINE                   | VECTORIZED, MEMORY_READ, INLINE                | -                        | VECTORIZED                       |
| 217  | MEMORY_WRITE, INLINE                  | INLINE                                         | MEMORY_WRITE             | -                                |
| 218  | MEMORY_READ                           | VECTORIZED, MEMORY_READ                        | -                        | VECTORIZED                       |
| 219  | MEMORY_READ, INLINE                   | VECTORIZED, MEMORY_READ, INLINE                | -                        | VECTORIZED                       |
| 220  | VECTORIZED                            | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -                        | MEMORY_WRITE, MEMORY_READ        |
| 234  | MEMORY_WRITE                          | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE             | VECTORIZED, MEMORY_READ          |
| 235  | MEMORY_WRITE, INLINE                  | VECTORIZED, MEMORY_READ, INLINE                | MEMORY_WRITE             | VECTORIZED, MEMORY_READ          |
| 237  | INLINE                                | VECTORIZED, MEMORY_READ, INLINE                | -                        | VECTORIZED, MEMORY_READ          |
| 253  | INLINE                                | VECTORIZED, MEMORY_READ, INLINE                | -                        | VECTORIZED, MEMORY_READ          |
| 255  | INLINE                                | VECTORIZED, MEMORY_READ, INLINE                | -                        | VECTORIZED, MEMORY_READ          |
| 256  | VECTORIZED                            | VECTORIZED, MEMORY_READ                        | -                        | MEMORY_READ                      |
| 271  | INLINE                                | HOISTED, MEMORY_READ, VECTORIZED, INLINE       | -                        | HOISTED, MEMORY_READ, VECTORIZED |
| 272  | HOISTED                               | HOISTED, MEMORY_READ, VECTORIZED               | -                        | MEMORY_READ, VECTORIZED          |
| 273  | HOISTED, INLINE                       | HOISTED, MEMORY_READ, VECTORIZED, INLINE       | -                        | MEMORY_READ, VECTORIZED          |
| 274  | HOISTED, VECTORIZED                   | HOISTED, MEMORY_READ, VECTORIZED               | -                        | MEMORY_READ                      |
| 288  | HOISTED                               | HOISTED, VECTORIZED, MEMORY_READ               | -                        | VECTORIZED, MEMORY_READ          |
| 289  | HOISTED, INLINE                       | HOISTED, VECTORIZED, MEMORY_READ, INLINE       | -                        | VECTORIZED, MEMORY_READ          |
| 290  | HOISTED                               | HOISTED, VECTORIZED, MEMORY_READ               | -                        | VECTORIZED, MEMORY_READ          |
| 291  | HOISTED, INLINE                       | HOISTED, VECTORIZED, MEMORY_READ, INLINE       | -                        | VECTORIZED, MEMORY_READ          |


### src/apps/INTSC_HEXHEX_BODY.hpp

**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                     |
| ---- | ------------------------ |
| 52   | MEMORY_WRITE, VECTORIZED |
| 351  | MEMORY_READ              |
| 375  | MEMORY_READ              |
| 386  | VECTORIZED               |
| 387  | VECTORIZED               |
| 388  | VECTORIZED               |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                        | O3 Tags                               | Only in O2   | Only in O3               |
| ---- | ---------------------------------------------- | ------------------------------------- | ------------ | ------------------------ |
| 30   | MEMORY_WRITE, MEMORY_READ, VECTORIZED          | MEMORY_WRITE, VECTORIZED              | MEMORY_READ  | -                        |
| 31   | MEMORY_WRITE, MEMORY_READ, VECTORIZED          | MEMORY_WRITE, VECTORIZED              | MEMORY_READ  | -                        |
| 33   | MEMORY_WRITE, MEMORY_READ, VECTORIZED          | MEMORY_WRITE, VECTORIZED              | MEMORY_READ  | -                        |
| 34   | MEMORY_WRITE, HOISTED, MEMORY_READ, VECTORIZED | HOISTED, MEMORY_READ, VECTORIZED      | MEMORY_WRITE | -                        |
| 35   | HOISTED, VECTORIZED                            | HOISTED                               | VECTORIZED   | -                        |
| 39   | HOISTED, MEMORY_READ, VECTORIZED               | HOISTED, VECTORIZED                   | MEMORY_READ  | -                        |
| 41   | HOISTED                                        | HOISTED, VECTORIZED                   | -            | VECTORIZED               |
| 54   | VECTORIZED                                     | MEMORY_WRITE, VECTORIZED              | -            | MEMORY_WRITE             |
| 56   | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE, VECTORIZED, MEMORY_READ | -            | MEMORY_WRITE             |
| 57   | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE, VECTORIZED, MEMORY_READ | -            | MEMORY_WRITE             |
| 65   | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE, VECTORIZED, MEMORY_READ | -            | MEMORY_WRITE             |
| 89   | MEMORY_WRITE, VECTORIZED                       | MEMORY_WRITE, MEMORY_READ, VECTORIZED | -            | MEMORY_READ              |
| 90   | MEMORY_WRITE, VECTORIZED                       | MEMORY_WRITE, MEMORY_READ, VECTORIZED | -            | MEMORY_READ              |
| 91   | MEMORY_WRITE, VECTORIZED                       | MEMORY_WRITE, MEMORY_READ, VECTORIZED | -            | MEMORY_READ              |
| 155  | VECTORIZED, MEMORY_READ                        | VECTORIZED                            | MEMORY_READ  | -                        |
| 167  | VECTORIZED, MEMORY_READ                        | VECTORIZED                            | MEMORY_READ  | -                        |
| 168  | VECTORIZED, MEMORY_READ                        | VECTORIZED                            | MEMORY_READ  | -                        |
| 170  | VECTORIZED, MEMORY_READ                        | VECTORIZED                            | MEMORY_READ  | -                        |
| 171  | VECTORIZED, MEMORY_READ                        | VECTORIZED                            | MEMORY_READ  | -                        |
| 172  | VECTORIZED, MEMORY_READ                        | VECTORIZED                            | MEMORY_READ  | -                        |
| 174  | MEMORY_WRITE, MEMORY_READ, VECTORIZED          | MEMORY_WRITE, VECTORIZED              | MEMORY_READ  | -                        |
| 179  | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | VECTORIZED, MEMORY_READ               | MEMORY_WRITE | -                        |
| 205  | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE, VECTORIZED, MEMORY_READ | -            | MEMORY_WRITE             |
| 216  | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE, VECTORIZED, MEMORY_READ | -            | MEMORY_WRITE             |
| 225  | VECTORIZED                                     | MEMORY_READ, VECTORIZED               | -            | MEMORY_READ              |
| 241  | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE, VECTORIZED, MEMORY_READ | -            | MEMORY_WRITE             |
| 283  | MEMORY_READ                                    | VECTORIZED, MEMORY_READ               | -            | VECTORIZED               |
| 317  | MEMORY_WRITE                                   | MEMORY_READ                           | MEMORY_WRITE | MEMORY_READ              |
| 327  | MEMORY_WRITE                                   | MEMORY_READ                           | MEMORY_WRITE | MEMORY_READ              |
| 328  | MEMORY_WRITE                                   | MEMORY_READ                           | MEMORY_WRITE | MEMORY_READ              |
| 330  | MEMORY_WRITE                                   | MEMORY_READ                           | MEMORY_WRITE | MEMORY_READ              |
| 331  | MEMORY_WRITE                                   | MEMORY_READ                           | MEMORY_WRITE | MEMORY_READ              |
| 333  | MEMORY_WRITE                                   | MEMORY_READ                           | MEMORY_WRITE | MEMORY_READ              |
| 334  | MEMORY_WRITE                                   | MEMORY_READ                           | MEMORY_WRITE | MEMORY_READ              |
| 335  | MEMORY_WRITE                                   | MEMORY_READ                           | MEMORY_WRITE | MEMORY_READ              |
| 336  | MEMORY_WRITE                                   | MEMORY_READ                           | MEMORY_WRITE | MEMORY_READ              |
| 338  | MEMORY_WRITE                                   | MEMORY_READ                           | MEMORY_WRITE | MEMORY_READ              |
| 339  | MEMORY_WRITE                                   | MEMORY_READ                           | MEMORY_WRITE | MEMORY_READ              |
| 342  | MEMORY_WRITE                                   | MEMORY_READ                           | MEMORY_WRITE | MEMORY_READ              |
| 344  | MEMORY_WRITE                                   | MEMORY_READ                           | MEMORY_WRITE | MEMORY_READ              |
| 349  | MEMORY_WRITE                                   | MEMORY_READ                           | MEMORY_WRITE | MEMORY_READ              |
| 350  | MEMORY_WRITE                                   | MEMORY_READ                           | MEMORY_WRITE | MEMORY_READ              |
| 363  | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE, VECTORIZED, MEMORY_READ | -            | MEMORY_WRITE             |
| 364  | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE, VECTORIZED, MEMORY_READ | -            | MEMORY_WRITE             |
| 365  | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE, VECTORIZED, MEMORY_READ | -            | MEMORY_WRITE             |
| 366  | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE, VECTORIZED, MEMORY_READ | -            | MEMORY_WRITE             |
| 368  | MEMORY_READ                                    | MEMORY_WRITE, VECTORIZED, MEMORY_READ | -            | MEMORY_WRITE, VECTORIZED |
| 369  | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE, VECTORIZED, MEMORY_READ | -            | MEMORY_WRITE             |
| 389  | MEMORY_READ                                    | VECTORIZED, MEMORY_READ               | -            | VECTORIZED               |
| 390  | VECTORIZED, MEMORY_READ                        | VECTORIZED                            | MEMORY_READ  | -                        |
| 391  | VECTORIZED, MEMORY_READ                        | VECTORIZED                            | MEMORY_READ  | -                        |
| 392  | VECTORIZED, MEMORY_READ                        | VECTORIZED                            | MEMORY_READ  | -                        |
| 393  | VECTORIZED, MEMORY_READ                        | VECTORIZED                            | MEMORY_READ  | -                        |
| 394  | VECTORIZED, MEMORY_READ                        | VECTORIZED                            | MEMORY_READ  | -                        |
| 396  | VECTORIZED, MEMORY_READ                        | VECTORIZED                            | MEMORY_READ  | -                        |


### src/apps/MASSVEC3DPA-Seq.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags   |
| ---- | ------ |
| 228  | INLINE |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                                           |
| ---- | ---------------------------------------------- |
| 110  | VECTORIZED, MEMORY_READ                        |
| 112  | VECTORIZED, MEMORY_READ                        |
| 117  | VECTORIZED, MEMORY_READ                        |
| 132  | VECTORIZED, MEMORY_READ                        |
| 135  | VECTORIZED, MEMORY_READ                        |
| 137  | VECTORIZED, MEMORY_READ                        |
| 146  | VECTORIZED, MEMORY_READ                        |
| 148  | HOISTED, VECTORIZED, MEMORY_READ, INLINE       |
| 149  | VECTORIZED, MEMORY_READ                        |
| 165  | MEMORY_WRITE, HOISTED, MEMORY_READ, VECTORIZED |
| 183  | MEMORY_READ, VECTORIZED                        |
| 197  | VECTORIZED, MEMORY_READ                        |
| 212  | INLINE                                         |
| 213  | VECTORIZED, MEMORY_READ                        |
| 215  | VECTORIZED, MEMORY_READ                        |
| 231  | VECTORIZED, MEMORY_READ                        |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                        | O3 Tags                                                | Only in O2   | Only in O3                                     |
| ---- | ---------------------------------------------- | ------------------------------------------------------ | ------------ | ---------------------------------------------- |
| 37   | MEMORY_WRITE, HOISTED, MEMORY_READ             | HOISTED, MEMORY_READ                                   | MEMORY_WRITE | -                                              |
| 45   | MEMORY_WRITE, HOISTED, MEMORY_READ             | MEMORY_WRITE, HOISTED, MEMORY_READ, VECTORIZED         | -            | VECTORIZED                                     |
| 48   | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | HOISTED, VECTORIZED, MEMORY_READ                       | MEMORY_WRITE | -                                              |
| 51   | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | HOISTED, VECTORIZED, MEMORY_READ                       | MEMORY_WRITE | -                                              |
| 56   | HOISTED, MEMORY_READ                           | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ         | -            | MEMORY_WRITE, VECTORIZED                       |
| 68   | MEMORY_WRITE, HOISTED, MEMORY_READ             | HOISTED, VECTORIZED, MEMORY_READ                       | MEMORY_WRITE | VECTORIZED                                     |
| 72   | HOISTED, MEMORY_READ                           | HOISTED, VECTORIZED, MEMORY_READ                       | -            | VECTORIZED                                     |
| 116  | INLINE                                         | VECTORIZED, MEMORY_READ, INLINE                        | -            | VECTORIZED, MEMORY_READ                        |
| 118  | INLINE                                         | VECTORIZED, MEMORY_READ, INLINE                        | -            | VECTORIZED, MEMORY_READ                        |
| 119  | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE, VECTORIZED, MEMORY_READ                  | -            | MEMORY_WRITE                                   |
| 120  | VECTORIZED, MEMORY_READ, INLINE                | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE          | -            | MEMORY_WRITE                                   |
| 121  | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE, VECTORIZED, MEMORY_READ                  | -            | MEMORY_WRITE                                   |
| 130  | MEMORY_WRITE, MEMORY_READ                      | MEMORY_WRITE, MEMORY_READ, VECTORIZED                  | -            | VECTORIZED                                     |
| 134  | VECTORIZED, MEMORY_READ, INLINE                | VECTORIZED, MEMORY_READ                                | INLINE       | -                                              |
| 136  | INLINE                                         | VECTORIZED, MEMORY_READ                                | INLINE       | VECTORIZED, MEMORY_READ                        |
| 138  | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | VECTORIZED, MEMORY_READ                                | MEMORY_WRITE | -                                              |
| 150  | INLINE                                         | VECTORIZED, MEMORY_READ, INLINE                        | -            | VECTORIZED, MEMORY_READ                        |
| 151  | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE, VECTORIZED, MEMORY_READ                  | -            | MEMORY_WRITE                                   |
| 152  | VECTORIZED, MEMORY_READ, INLINE                | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE          | -            | MEMORY_WRITE                                   |
| 153  | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE, VECTORIZED, MEMORY_READ                  | -            | MEMORY_WRITE                                   |
| 166  | INLINE                                         | MEMORY_READ, MEMORY_WRITE, HOISTED, INLINE, VECTORIZED | -            | MEMORY_WRITE, HOISTED, MEMORY_READ, VECTORIZED |
| 167  | HOISTED                                        | MEMORY_WRITE, HOISTED, MEMORY_READ, VECTORIZED         | -            | MEMORY_WRITE, MEMORY_READ, VECTORIZED          |
| 168  | HOISTED, INLINE                                | MEMORY_READ, MEMORY_WRITE, HOISTED, INLINE, VECTORIZED | -            | MEMORY_WRITE, MEMORY_READ, VECTORIZED          |
| 169  | HOISTED, VECTORIZED                            | MEMORY_WRITE, HOISTED, MEMORY_READ, VECTORIZED         | -            | MEMORY_WRITE, MEMORY_READ                      |
| 181  | MEMORY_WRITE                                   | VECTORIZED, MEMORY_READ                                | MEMORY_WRITE | VECTORIZED, MEMORY_READ                        |
| 182  | MEMORY_WRITE, INLINE                           | VECTORIZED, MEMORY_READ, INLINE                        | MEMORY_WRITE | VECTORIZED, MEMORY_READ                        |
| 184  | INLINE                                         | MEMORY_READ, VECTORIZED, INLINE                        | -            | MEMORY_READ, VECTORIZED                        |
| 185  | VECTORIZED                                     | MEMORY_READ, VECTORIZED                                | -            | MEMORY_READ                                    |
| 198  | INLINE                                         | VECTORIZED, MEMORY_READ, INLINE                        | -            | VECTORIZED, MEMORY_READ                        |
| 214  | INLINE                                         | VECTORIZED, MEMORY_READ, INLINE                        | -            | VECTORIZED, MEMORY_READ                        |
| 216  | INLINE                                         | VECTORIZED, MEMORY_READ, INLINE                        | -            | VECTORIZED, MEMORY_READ                        |
| 217  | HOISTED                                        | HOISTED, VECTORIZED, MEMORY_READ                       | -            | VECTORIZED, MEMORY_READ                        |
| 229  | MEMORY_WRITE                                   | VECTORIZED, MEMORY_READ                                | MEMORY_WRITE | VECTORIZED, MEMORY_READ                        |
| 230  | MEMORY_WRITE, INLINE                           | VECTORIZED, MEMORY_READ, INLINE                        | MEMORY_WRITE | VECTORIZED, MEMORY_READ                        |
| 232  | INLINE                                         | VECTORIZED, MEMORY_READ, INLINE                        | -            | VECTORIZED, MEMORY_READ                        |
| 233  | HOISTED                                        | HOISTED, VECTORIZED, MEMORY_READ                       | -            | VECTORIZED, MEMORY_READ                        |


### src/apps/MASS3DPA_ATOMIC-Seq.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags   |
| ---- | ------ |
| 214  | INLINE |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                                  |
| ---- | ------------------------------------- |
| 114  | MEMORY_READ                           |
| 116  | MEMORY_READ                           |
| 128  | MEMORY_WRITE, VECTORIZED, INLINE      |
| 129  | MEMORY_WRITE, VECTORIZED              |
| 143  | MEMORY_READ, INLINE                   |
| 144  | MEMORY_WRITE, VECTORIZED, MEMORY_READ |
| 158  | MEMORY_WRITE, MEMORY_READ, VECTORIZED |
| 160  | MEMORY_WRITE, MEMORY_READ, VECTORIZED |
| 186  | VECTORIZED, MEMORY_READ               |
| 199  | INLINE                                |
| 200  | VECTORIZED, MEMORY_READ               |
| 202  | VECTORIZED, MEMORY_READ               |
| 215  | VECTORIZED, MEMORY_READ               |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                                | Only in O2   | Only in O3                                     |
| ---- | ------------------------------------- | ------------------------------------------------------ | ------------ | ---------------------------------------------- |
| 24   | MEMORY_READ, INLINE                   | MEMORY_WRITE, INLINE                                   | MEMORY_READ  | MEMORY_WRITE                                   |
| 37   | MEMORY_WRITE, HOISTED, MEMORY_READ    | HOISTED, MEMORY_READ                                   | MEMORY_WRITE | -                                              |
| 41   | MEMORY_WRITE, MEMORY_READ             | MEMORY_WRITE, VECTORIZED, MEMORY_READ                  | -            | VECTORIZED                                     |
| 49   | VECTORIZED, MEMORY_READ               | MEMORY_WRITE, VECTORIZED, MEMORY_READ                  | -            | MEMORY_WRITE                                   |
| 50   | MEMORY_WRITE, MEMORY_READ, VECTORIZED | MEMORY_WRITE, HOISTED, MEMORY_READ, VECTORIZED         | -            | HOISTED                                        |
| 53   | MEMORY_WRITE, MEMORY_READ             | MEMORY_WRITE, MEMORY_READ, VECTORIZED                  | -            | VECTORIZED                                     |
| 58   | MEMORY_WRITE, MEMORY_READ, VECTORIZED | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ         | -            | HOISTED                                        |
| 61   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | VECTORIZED, MEMORY_READ                                | MEMORY_WRITE | -                                              |
| 65   | MEMORY_WRITE, MEMORY_READ             | VECTORIZED, MEMORY_READ                                | MEMORY_WRITE | VECTORIZED                                     |
| 69   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | VECTORIZED, MEMORY_READ                                | MEMORY_WRITE | -                                              |
| 70   | MEMORY_READ, VECTORIZED               | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ         | -            | MEMORY_WRITE, HOISTED                          |
| 115  | INLINE                                | MEMORY_READ, INLINE                                    | -            | MEMORY_READ                                    |
| 117  | INLINE                                | MEMORY_READ, INLINE                                    | -            | MEMORY_READ                                    |
| 130  | INLINE                                | MEMORY_WRITE, VECTORIZED, INLINE                       | -            | MEMORY_WRITE, VECTORIZED                       |
| 131  | VECTORIZED, MEMORY_READ               | MEMORY_WRITE, MEMORY_READ, VECTORIZED                  | -            | MEMORY_WRITE                                   |
| 132  | VECTORIZED, MEMORY_READ, INLINE       | MEMORY_WRITE, MEMORY_READ, VECTORIZED, INLINE          | -            | MEMORY_WRITE                                   |
| 133  | VECTORIZED, MEMORY_READ               | MEMORY_WRITE, MEMORY_READ, VECTORIZED                  | -            | MEMORY_WRITE                                   |
| 145  | INLINE                                | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE          | -            | MEMORY_WRITE, VECTORIZED, MEMORY_READ          |
| 146  | VECTORIZED, MEMORY_READ               | MEMORY_WRITE, VECTORIZED, MEMORY_READ                  | -            | MEMORY_WRITE                                   |
| 147  | VECTORIZED, MEMORY_READ, INLINE       | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE          | -            | MEMORY_WRITE                                   |
| 148  | VECTORIZED, MEMORY_READ               | MEMORY_WRITE, VECTORIZED, MEMORY_READ                  | -            | MEMORY_WRITE                                   |
| 159  | INLINE                                | MEMORY_READ, MEMORY_WRITE, HOISTED, INLINE, VECTORIZED | -            | MEMORY_WRITE, HOISTED, MEMORY_READ, VECTORIZED |
| 161  | INLINE                                | MEMORY_WRITE, MEMORY_READ, VECTORIZED, INLINE          | -            | MEMORY_WRITE, MEMORY_READ, VECTORIZED          |
| 162  | VECTORIZED                            | MEMORY_WRITE, MEMORY_READ, VECTORIZED                  | -            | MEMORY_WRITE, MEMORY_READ                      |
| 172  | HOISTED                               | HOISTED, VECTORIZED, MEMORY_READ                       | -            | VECTORIZED, MEMORY_READ                        |
| 173  | HOISTED, INLINE                       | HOISTED, VECTORIZED, MEMORY_READ, INLINE               | -            | VECTORIZED, MEMORY_READ                        |
| 174  | HOISTED                               | HOISTED, MEMORY_READ, VECTORIZED                       | -            | MEMORY_READ, VECTORIZED                        |
| 175  | HOISTED, INLINE                       | HOISTED, MEMORY_READ, VECTORIZED, INLINE               | -            | MEMORY_READ, VECTORIZED                        |
| 176  | HOISTED, VECTORIZED                   | HOISTED, MEMORY_READ, VECTORIZED                       | -            | MEMORY_READ                                    |
| 187  | INLINE                                | VECTORIZED, MEMORY_READ, INLINE                        | -            | VECTORIZED, MEMORY_READ                        |
| 201  | INLINE                                | VECTORIZED, MEMORY_READ, INLINE                        | -            | VECTORIZED, MEMORY_READ                        |
| 203  | HOISTED, INLINE                       | HOISTED, VECTORIZED, MEMORY_READ, INLINE               | -            | VECTORIZED, MEMORY_READ                        |
| 204  | HOISTED                               | HOISTED, VECTORIZED, MEMORY_READ                       | -            | VECTORIZED, MEMORY_READ                        |
| 216  | INLINE                                | VECTORIZED, MEMORY_READ, INLINE                        | -            | VECTORIZED, MEMORY_READ                        |
| 217  | HOISTED                               | HOISTED, VECTORIZED, MEMORY_READ                       | -            | VECTORIZED, MEMORY_READ                        |
| 218  | HOISTED, INLINE                       | HOISTED, VECTORIZED, MEMORY_READ, INLINE               | -            | VECTORIZED, MEMORY_READ                        |
| 220  | VECTORIZED, MEMORY_READ               | MEMORY_WRITE, MEMORY_READ, VECTORIZED                  | -            | MEMORY_WRITE                                   |


### src/apps/MASS3DPA-Seq.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags        |
| ---- | ----------- |
| 61   | MEMORY_READ |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                                      |
| ---- | ----------------------------------------- |
| 41   | MEMORY_WRITE, VECTORIZED, MEMORY_READ     |
| 86   | VECTORIZED, MEMORY_READ                   |
| 127  | VECTORIZED, MEMORY_READ                   |
| 129  | MEMORY_WRITE, VECTORIZED, MEMORY_READ     |
| 144  | INLINE                                    |
| 145  | VECTORIZED, MEMORY_READ                   |
| 157  | VECTORIZED, MEMORY_READ                   |
| 169  | VECTORIZED, MEMORY_READ                   |
| 178  | VECTORIZED, MEMORY_READ                   |
| 180  | VECTORIZED, MEMORY_READ, INLINE           |
| 183  | MEMORY_WRITE, VECTORIZED, MEMORY_READ     |
| 190  | MEMORY_WRITE, VECTORIZED                  |
| 192  | MEMORY_WRITE, HOISTED, VECTORIZED, INLINE |
| 217  | VECTORIZED, MEMORY_READ                   |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                       | Only in O2   | Only in O3                            |
| ---- | ------------------------------------- | --------------------------------------------- | ------------ | ------------------------------------- |
| 40   | VECTORIZED, MEMORY_READ               | MEMORY_WRITE, VECTORIZED, MEMORY_READ         | -            | MEMORY_WRITE                          |
| 49   | MEMORY_READ                           | MEMORY_WRITE, VECTORIZED, MEMORY_READ         | -            | MEMORY_WRITE, VECTORIZED              |
| 50   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | VECTORIZED, MEMORY_READ                       | MEMORY_WRITE | -                                     |
| 55   | MEMORY_WRITE, MEMORY_READ             | MEMORY_WRITE, VECTORIZED, MEMORY_READ         | -            | VECTORIZED                            |
| 56   | MEMORY_WRITE                          | VECTORIZED, MEMORY_READ                       | MEMORY_WRITE | VECTORIZED, MEMORY_READ               |
| 62   | MEMORY_WRITE                          | VECTORIZED, MEMORY_READ                       | MEMORY_WRITE | VECTORIZED, MEMORY_READ               |
| 67   | MEMORY_READ                           | MEMORY_WRITE, VECTORIZED, MEMORY_READ         | -            | MEMORY_WRITE, VECTORIZED              |
| 68   | VECTORIZED, MEMORY_READ               | MEMORY_WRITE, VECTORIZED, MEMORY_READ         | -            | MEMORY_WRITE                          |
| 73   | MEMORY_WRITE, MEMORY_READ             | MEMORY_WRITE, MEMORY_READ, VECTORIZED         | -            | VECTORIZED                            |
| 74   | MEMORY_WRITE                          | VECTORIZED, MEMORY_READ                       | MEMORY_WRITE | VECTORIZED, MEMORY_READ               |
| 79   | MEMORY_WRITE, HOISTED, MEMORY_READ    | MEMORY_WRITE, VECTORIZED, MEMORY_READ         | HOISTED      | VECTORIZED                            |
| 80   | MEMORY_READ                           | VECTORIZED, MEMORY_READ                       | -            | VECTORIZED                            |
| 122  | MEMORY_READ                           | VECTORIZED, MEMORY_READ                       | -            | VECTORIZED                            |
| 124  | MEMORY_READ                           | VECTORIZED, MEMORY_READ                       | -            | VECTORIZED                            |
| 126  | MEMORY_READ, INLINE                   | VECTORIZED, MEMORY_READ, INLINE               | -            | VECTORIZED                            |
| 128  | INLINE                                | VECTORIZED, MEMORY_READ, INLINE               | -            | VECTORIZED, MEMORY_READ               |
| 134  | INLINE                                | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE | -            | MEMORY_WRITE, VECTORIZED, MEMORY_READ |
| 146  | INLINE                                | VECTORIZED, MEMORY_READ, INLINE               | -            | VECTORIZED, MEMORY_READ               |
| 147  | MEMORY_WRITE, VECTORIZED              | VECTORIZED, MEMORY_READ                       | MEMORY_WRITE | MEMORY_READ                           |
| 158  | INLINE                                | VECTORIZED, MEMORY_READ, INLINE               | -            | VECTORIZED, MEMORY_READ               |
| 159  | MEMORY_WRITE, VECTORIZED              | MEMORY_READ, VECTORIZED                       | MEMORY_WRITE | MEMORY_READ                           |
| 170  | INLINE                                | VECTORIZED, MEMORY_READ, INLINE               | -            | VECTORIZED, MEMORY_READ               |
| 171  | MEMORY_WRITE, VECTORIZED              | VECTORIZED, MEMORY_READ                       | MEMORY_WRITE | MEMORY_READ                           |
| 193  | MEMORY_WRITE, HOISTED                 | HOISTED, VECTORIZED, MEMORY_READ              | MEMORY_WRITE | VECTORIZED, MEMORY_READ               |
| 194  | MEMORY_WRITE, HOISTED, INLINE         | HOISTED, VECTORIZED, MEMORY_READ, INLINE      | MEMORY_WRITE | VECTORIZED, MEMORY_READ               |
| 195  | MEMORY_WRITE, HOISTED, VECTORIZED     | HOISTED, VECTORIZED, MEMORY_READ              | MEMORY_WRITE | MEMORY_READ                           |
| 205  | MEMORY_READ                           | VECTORIZED, MEMORY_READ                       | -            | VECTORIZED                            |
| 206  | MEMORY_READ, INLINE                   | VECTORIZED, MEMORY_READ, INLINE               | -            | VECTORIZED                            |
| 207  | MEMORY_WRITE, VECTORIZED              | MEMORY_READ, VECTORIZED                       | MEMORY_WRITE | MEMORY_READ                           |
| 218  | INLINE                                | VECTORIZED, MEMORY_READ, INLINE               | -            | VECTORIZED, MEMORY_READ               |
| 219  | MEMORY_WRITE, VECTORIZED              | VECTORIZED, MEMORY_READ                       | MEMORY_WRITE | MEMORY_READ                           |


### src/apps/INTSC_HEXHEX.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags                      |
| ---- | ------------------------- |
| 169  | MEMORY_WRITE, MEMORY_READ |
| 172  | MEMORY_READ               |
| 174  | MEMORY_READ               |
| 175  | MEMORY_READ               |
| 177  | MEMORY_READ               |
| 178  | MEMORY_READ               |
| 183  | MEMORY_READ               |
| 184  | MEMORY_READ               |
| 185  | MEMORY_READ               |
| 186  | MEMORY_READ               |
| 189  | MEMORY_READ               |
| 190  | MEMORY_READ               |
| 191  | MEMORY_READ               |
| 193  | MEMORY_READ               |
| 194  | MEMORY_READ               |
| 195  | MEMORY_READ               |
| 196  | MEMORY_READ               |
| 200  | MEMORY_READ               |
| 201  | MEMORY_READ               |
| 202  | MEMORY_READ               |
| 204  | MEMORY_READ               |
| 206  | MEMORY_READ               |
| 242  | MEMORY_WRITE, MEMORY_READ |
| 257  | HOISTED, MEMORY_READ      |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                                      | O3 Tags                                                | Only in O2                     | Only in O3         |
| ---- | ------------------------------------------------------------ | ------------------------------------------------------ | ------------------------------ | ------------------ |
| 129  | VECTORIZED, MEMORY_READ                                      | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL            | -                              | MEMORY_WRITE, CALL |
| 130  | MEMORY_WRITE, VECTORIZED, MEMORY_READ                        | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ         | -                              | HOISTED            |
| 135  | MEMORY_WRITE, MEMORY_READ, INLINE                            | MEMORY_WRITE, MEMORY_READ, INLINE, CALL                | -                              | CALL               |
| 136  | MEMORY_WRITE, MEMORY_READ, INLINE                            | MEMORY_READ, INLINE                                    | MEMORY_WRITE                   | -                  |
| 141  | MEMORY_WRITE, MEMORY_READ                                    | VECTORIZED, MEMORY_READ                                | MEMORY_WRITE                   | VECTORIZED         |
| 152  | MEMORY_WRITE, MEMORY_READ, INLINE                            | MEMORY_READ, INLINE                                    | MEMORY_WRITE                   | -                  |
| 154  | MEMORY_WRITE, MEMORY_READ, INLINE                            | MEMORY_READ, INLINE                                    | MEMORY_WRITE                   | -                  |
| 157  | MEMORY_WRITE, MEMORY_READ, INLINE                            | MEMORY_READ, INLINE                                    | MEMORY_WRITE                   | -                  |
| 209  | VECTORIZED, MEMORY_READ                                      | MEMORY_WRITE, VECTORIZED, MEMORY_READ                  | -                              | MEMORY_WRITE       |
| 215  | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ               | HOISTED, VECTORIZED, MEMORY_READ                       | MEMORY_WRITE                   | -                  |
| 223  | MEMORY_WRITE, HOISTED, VECTORIZED                            | MEMORY_WRITE, HOISTED, VECTORIZED, CALL                | -                              | CALL               |
| 230  | MEMORY_WRITE, HOISTED, CALL                                  | MEMORY_WRITE, HOISTED, VECTORIZED, CALL                | -                              | VECTORIZED         |
| 231  | HOISTED, MEMORY_READ, INLINE                                 | INLINE                                                 | HOISTED, MEMORY_READ           | -                  |
| 247  | MEMORY_READ, MEMORY_WRITE, HOISTED, INLINE, CALL             | MEMORY_WRITE, HOISTED, INLINE, CALL                    | MEMORY_READ                    | -                  |
| 249  | HOISTED, MEMORY_READ, INLINE                                 | INLINE                                                 | HOISTED, MEMORY_READ           | -                  |
| 251  | MEMORY_READ, MEMORY_WRITE, HOISTED, INLINE, VECTORIZED, CALL | MEMORY_READ, MEMORY_WRITE, HOISTED, INLINE, VECTORIZED | CALL                           | -                  |
| 252  | MEMORY_READ, MEMORY_WRITE, HOISTED, INLINE, VECTORIZED, CALL | MEMORY_READ, MEMORY_WRITE, HOISTED, INLINE, VECTORIZED | CALL                           | -                  |
| 253  | MEMORY_READ, MEMORY_WRITE, HOISTED, INLINE, VECTORIZED, CALL | MEMORY_READ, MEMORY_WRITE, HOISTED, INLINE, VECTORIZED | CALL                           | -                  |
| 254  | MEMORY_READ, MEMORY_WRITE, HOISTED, INLINE, VECTORIZED, CALL | HOISTED, MEMORY_READ, INLINE                           | MEMORY_WRITE, VECTORIZED, CALL | -                  |


### src/basic/MAT_MAT_SHARED-Seq.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags        |
| ---- | ----------- |
| 99   | INLINE      |
| 138  | INLINE      |
| 183  | MEMORY_READ |
| 185  | MEMORY_READ |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                                     |
| ---- | ---------------------------------------- |
| 41   | MEMORY_WRITE, HOISTED                    |
| 54   | HOISTED                                  |
| 91   | MEMORY_WRITE, HOISTED                    |
| 120  | HOISTED, VECTORIZED, MEMORY_READ, INLINE |
| 143  | INLINE                                   |
| 148  | INLINE                                   |
| 181  | MEMORY_READ                              |
| 203  | VECTORIZED                               |
| 222  | MEMORY_READ                              |
| 229  | MEMORY_READ                              |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                        | Only in O2   | Only in O3            |
| ---- | ------------------------------------- | ---------------------------------------------- | ------------ | --------------------- |
| 33   | MEMORY_WRITE, HOISTED, MEMORY_READ    | HOISTED, MEMORY_READ                           | MEMORY_WRITE | -                     |
| 34   | MEMORY_WRITE, HOISTED, MEMORY_READ    | HOISTED, MEMORY_READ                           | MEMORY_WRITE | -                     |
| 40   | MEMORY_READ                           | MEMORY_WRITE, HOISTED                          | MEMORY_READ  | MEMORY_WRITE, HOISTED |
| 46   | MEMORY_WRITE, MEMORY_READ             | MEMORY_WRITE, HOISTED, MEMORY_READ             | -            | HOISTED               |
| 48   | MEMORY_WRITE, MEMORY_READ             | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -            | HOISTED, VECTORIZED   |
| 49   | MEMORY_READ                           | HOISTED, MEMORY_READ, VECTORIZED               | -            | HOISTED, VECTORIZED   |
| 55   | MEMORY_READ                           | HOISTED, VECTORIZED, MEMORY_READ               | -            | HOISTED, VECTORIZED   |
| 56   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -            | HOISTED               |
| 62   | MEMORY_READ                           | HOISTED, MEMORY_READ                           | -            | HOISTED               |
| 63   | MEMORY_READ                           | HOISTED, MEMORY_READ                           | -            | HOISTED               |
| 97   | MEMORY_READ                           | MEMORY_WRITE                                   | MEMORY_READ  | MEMORY_WRITE          |
| 107  | HOISTED, MEMORY_READ                  | HOISTED, MEMORY_READ, VECTORIZED               | -            | VECTORIZED            |
| 108  | HOISTED, INLINE                       | HOISTED, VECTORIZED, INLINE                    | -            | VECTORIZED            |
| 112  | MEMORY_WRITE, MEMORY_READ             | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -            | VECTORIZED            |
| 119  | HOISTED, MEMORY_READ                  | HOISTED, VECTORIZED, MEMORY_READ               | -            | VECTORIZED            |
| 132  | MEMORY_WRITE                          | MEMORY_READ                                    | MEMORY_WRITE | MEMORY_READ           |
| 133  | INLINE                                | MEMORY_READ, INLINE                            | -            | MEMORY_READ           |
| 147  | MEMORY_WRITE, MEMORY_READ             | MEMORY_READ                                    | MEMORY_WRITE | -                     |
| 182  | INLINE                                | MEMORY_READ, INLINE                            | -            | MEMORY_READ           |
| 187  | MEMORY_READ, INLINE                   | INLINE                                         | MEMORY_READ  | -                     |
| 192  | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, VECTORIZED                       | MEMORY_READ  | -                     |
| 213  | MEMORY_READ                           | VECTORIZED, MEMORY_READ                        | -            | VECTORIZED            |
| 214  | MEMORY_READ, INLINE                   | VECTORIZED, MEMORY_READ, INLINE                | -            | VECTORIZED            |
| 226  | INLINE                                | MEMORY_READ, INLINE                            | -            | MEMORY_READ           |


### tpl/RAJA/include/RAJA/util/basic_mempool.hpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags                       |
| ---- | -------------------------- |
| 121  | MEMORY_READ                |
| 223  | MEMORY_WRITE               |
| 229  | MEMORY_WRITE, CALL         |
| 230  | MEMORY_WRITE, INLINE, CALL |
| 231  | INLINE                     |
| 251  | MEMORY_WRITE, CALL         |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                                    |
| ---- | --------------------------------------- |
| 103  | HOISTED                                 |
| 168  | MEMORY_WRITE, CALL                      |
| 176  | MEMORY_READ                             |
| 186  | MEMORY_WRITE, MEMORY_READ, INLINE, CALL |
| 193  | MEMORY_READ                             |
| 203  | MEMORY_READ                             |
| 241  | MEMORY_READ, INLINE                     |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                 | O3 Tags                                 | Only in O2         | Only in O3                      |
| ---- | --------------------------------------- | --------------------------------------- | ------------------ | ------------------------------- |
| 69   | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | MEMORY_WRITE, INLINE                    | MEMORY_READ, CALL  | -                               |
| 93   | MEMORY_WRITE, MEMORY_READ               | MEMORY_READ                             | MEMORY_WRITE       | -                               |
| 98   | MEMORY_WRITE, INLINE                    | MEMORY_READ, INLINE                     | MEMORY_WRITE       | MEMORY_READ                     |
| 99   | MEMORY_WRITE, INLINE                    | INLINE                                  | MEMORY_WRITE       | -                               |
| 102  | MEMORY_READ                             | HOISTED, MEMORY_READ                    | -                  | HOISTED                         |
| 104  | MEMORY_READ                             | HOISTED, MEMORY_READ                    | -                  | HOISTED                         |
| 106  | INLINE                                  | HOISTED, INLINE                         | -                  | HOISTED                         |
| 114  | MEMORY_WRITE, HOISTED, INLINE, CALL     | HOISTED, INLINE                         | MEMORY_WRITE, CALL | -                               |
| 123  | MEMORY_READ                             | MEMORY_READ, INLINE                     | -                  | INLINE                          |
| 135  | INLINE                                  | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | -                  | MEMORY_WRITE, MEMORY_READ, CALL |
| 158  | MEMORY_READ, INLINE                     | MEMORY_WRITE, MEMORY_READ               | INLINE             | MEMORY_WRITE                    |
| 161  | MEMORY_READ, INLINE                     | MEMORY_WRITE, MEMORY_READ, INLINE       | -                  | MEMORY_WRITE                    |
| 165  | MEMORY_READ, INLINE                     | MEMORY_WRITE, MEMORY_READ, INLINE       | -                  | MEMORY_WRITE                    |
| 169  | INLINE                                  | MEMORY_WRITE, INLINE, CALL              | -                  | MEMORY_WRITE, CALL              |
| 200  | MEMORY_READ, INLINE                     | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | -                  | MEMORY_WRITE, CALL              |
| 201  | INLINE                                  | MEMORY_READ, INLINE                     | -                  | MEMORY_READ                     |
| 209  | INLINE                                  | MEMORY_WRITE, INLINE, CALL              | -                  | MEMORY_WRITE, CALL              |
| 238  | MEMORY_WRITE, CALL                      | MEMORY_WRITE                            | CALL               | -                               |
| 239  | MEMORY_WRITE, INLINE, CALL              | MEMORY_WRITE, INLINE                    | CALL               | -                               |
| 240  | INLINE                                  | MEMORY_READ, INLINE                     | -                  | MEMORY_READ                     |
| 254  | MEMORY_WRITE, INLINE, CALL              | INLINE                                  | MEMORY_WRITE, CALL | -                               |
| 371  | MEMORY_WRITE, INLINE, CALL              | INLINE                                  | MEMORY_WRITE, CALL | -                               |
| 386  | MEMORY_WRITE, INLINE, CALL              | INLINE                                  | MEMORY_WRITE, CALL | -                               |
| 393  | MEMORY_WRITE                            | MEMORY_WRITE, MEMORY_READ, CALL         | -                  | MEMORY_READ, CALL               |


### src/comm/HALO_PACKING_FUSED-Seq.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags               |
| ---- | ------------------ |
| 30   | MEMORY_WRITE, CALL |
| 105  | MEMORY_WRITE, CALL |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                                  |
| ---- | ------------------------------------- |
| 48   | HOISTED                               |
| 61   | MEMORY_READ                           |
| 74   | MEMORY_READ                           |
| 78   | VECTORIZED                            |
| 82   | HOISTED                               |
| 124  | MEMORY_WRITE, VECTORIZED, MEMORY_READ |
| 134  | MEMORY_READ                           |
| 147  | MEMORY_READ                           |
| 151  | MEMORY_READ, VECTORIZED               |
| 156  | MEMORY_WRITE, VECTORIZED, MEMORY_READ |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                            | O3 Tags                                        | Only in O2   | Only in O3                            |
| ---- | ---------------------------------- | ---------------------------------------------- | ------------ | ------------------------------------- |
| 36   | MEMORY_WRITE, MEMORY_READ          | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -            | VECTORIZED                            |
| 41   | HOISTED, MEMORY_READ               | MEMORY_WRITE, HOISTED, MEMORY_READ             | -            | MEMORY_WRITE                          |
| 42   | HOISTED, VECTORIZED, MEMORY_READ   | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -            | MEMORY_WRITE                          |
| 44   | MEMORY_WRITE, HOISTED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -            | VECTORIZED                            |
| 45   | MEMORY_WRITE, MEMORY_READ          | HOISTED, VECTORIZED, MEMORY_READ               | MEMORY_WRITE | HOISTED, VECTORIZED                   |
| 46   | MEMORY_WRITE, VECTORIZED           | MEMORY_WRITE, HOISTED, VECTORIZED              | -            | HOISTED                               |
| 47   | MEMORY_WRITE, VECTORIZED           | MEMORY_WRITE, HOISTED, VECTORIZED              | -            | HOISTED                               |
| 49   | HOISTED                            | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -            | MEMORY_WRITE, VECTORIZED, MEMORY_READ |
| 52   | MEMORY_WRITE, MEMORY_READ          | MEMORY_READ                                    | MEMORY_WRITE | -                                     |
| 62   | MEMORY_READ                        | VECTORIZED, MEMORY_READ                        | -            | VECTORIZED                            |
| 79   | MEMORY_READ                        | HOISTED, MEMORY_READ, VECTORIZED               | -            | HOISTED, VECTORIZED                   |
| 80   | MEMORY_WRITE, VECTORIZED           | MEMORY_WRITE, HOISTED, VECTORIZED              | -            | HOISTED                               |
| 81   | MEMORY_WRITE                       | MEMORY_WRITE, HOISTED, VECTORIZED              | -            | HOISTED, VECTORIZED                   |
| 83   | HOISTED                            | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -            | MEMORY_WRITE, VECTORIZED, MEMORY_READ |
| 86   | MEMORY_WRITE, MEMORY_READ          | MEMORY_READ                                    | MEMORY_WRITE | -                                     |
| 111  | MEMORY_WRITE, MEMORY_READ          | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -            | VECTORIZED                            |
| 117  | MEMORY_READ                        | VECTORIZED, MEMORY_READ                        | -            | VECTORIZED                            |
| 119  | MEMORY_WRITE, MEMORY_READ          | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -            | VECTORIZED                            |
| 120  | VECTORIZED                         | VECTORIZED, MEMORY_READ                        | -            | MEMORY_READ                           |
| 122  | MEMORY_WRITE                       | MEMORY_WRITE, VECTORIZED                       | -            | VECTORIZED                            |
| 127  | MEMORY_WRITE, MEMORY_READ          | MEMORY_READ                                    | MEMORY_WRITE | -                                     |
| 135  | MEMORY_READ                        | VECTORIZED, MEMORY_READ                        | -            | VECTORIZED                            |
| 143  | MEMORY_WRITE, MEMORY_READ          | MEMORY_READ                                    | MEMORY_WRITE | -                                     |
| 154  | MEMORY_WRITE                       | MEMORY_WRITE, VECTORIZED                       | -            | VECTORIZED                            |


### src/apps/INTSC_HEXRECT.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags                               |
| ---- | ---------------------------------- |
| 198  | VECTORIZED                         |
| 332  | VECTORIZED, MEMORY_READ            |
| 529  | MEMORY_WRITE, HOISTED, MEMORY_READ |
| 538  | MEMORY_READ                        |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                    |
| ---- | ----------------------- |
| 211  | MEMORY_READ             |
| 337  | VECTORIZED, MEMORY_READ |
| 504  | VECTORIZED, MEMORY_READ |
| 505  | VECTORIZED, MEMORY_READ |
| 508  | VECTORIZED, MEMORY_READ |
| 511  | VECTORIZED, MEMORY_READ |
| 513  | VECTORIZED, MEMORY_READ |
| 514  | MEMORY_READ             |
| 516  | VECTORIZED, MEMORY_READ |
| 518  | VECTORIZED, MEMORY_READ |
| 521  | VECTORIZED, MEMORY_READ |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                 | O3 Tags                                        | Only in O2                | Only in O3          |
| ---- | --------------------------------------- | ---------------------------------------------- | ------------------------- | ------------------- |
| 200  | HOISTED, MEMORY_READ                    | VECTORIZED                                     | HOISTED, MEMORY_READ      | VECTORIZED          |
| 201  | HOISTED, MEMORY_READ, VECTORIZED        | HOISTED, VECTORIZED                            | MEMORY_READ               | -                   |
| 212  | MEMORY_READ                             | HOISTED, MEMORY_READ                           | -                         | HOISTED             |
| 241  | MEMORY_READ                             | MEMORY_WRITE, MEMORY_READ                      | -                         | MEMORY_WRITE        |
| 245  | MEMORY_READ                             | HOISTED, MEMORY_READ                           | -                         | HOISTED             |
| 261  | MEMORY_WRITE, VECTORIZED                | VECTORIZED                                     | MEMORY_WRITE              | -                   |
| 345  | VECTORIZED                              | MEMORY_WRITE                                   | VECTORIZED                | MEMORY_WRITE        |
| 492  | MEMORY_WRITE, HOISTED, MEMORY_READ      | HOISTED                                        | MEMORY_WRITE, MEMORY_READ | -                   |
| 495  | MEMORY_WRITE, HOISTED, MEMORY_READ      | HOISTED, MEMORY_READ                           | MEMORY_WRITE              | -                   |
| 496  | MEMORY_WRITE, HOISTED, MEMORY_READ      | MEMORY_WRITE, HOISTED                          | MEMORY_READ               | -                   |
| 498  | HOISTED, MEMORY_READ                    | MEMORY_WRITE, HOISTED, MEMORY_READ             | -                         | MEMORY_WRITE        |
| 500  | MEMORY_WRITE, HOISTED, MEMORY_READ      | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -                         | VECTORIZED          |
| 501  | MEMORY_WRITE, MEMORY_READ               | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -                         | HOISTED, VECTORIZED |
| 523  | VECTORIZED                              | VECTORIZED, MEMORY_READ                        | -                         | MEMORY_READ         |
| 524  | VECTORIZED                              | VECTORIZED, MEMORY_READ                        | -                         | MEMORY_READ         |
| 528  | VECTORIZED, MEMORY_READ                 | VECTORIZED                                     | MEMORY_READ               | -                   |
| 540  | VECTORIZED, MEMORY_READ                 | MEMORY_WRITE, MEMORY_READ, VECTORIZED          | -                         | MEMORY_WRITE        |
| 554  | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | MEMORY_WRITE, INLINE, CALL                     | MEMORY_READ               | -                   |
| 575  | MEMORY_WRITE, MEMORY_READ               | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -                         | VECTORIZED          |


### src/apps/EDGE3D.hpp

**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags   |
| ---- | ------ |
| 347  | INLINE |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                        | O3 Tags                                        | Only in O2                | Only in O3   |
| ---- | ---------------------------------------------- | ---------------------------------------------- | ------------------------- | ------------ |
| 239  | MEMORY_WRITE, MEMORY_READ                      | MEMORY_READ                                    | MEMORY_WRITE              | -            |
| 244  | MEMORY_WRITE, HOISTED, MEMORY_READ, VECTORIZED | MEMORY_WRITE, HOISTED, VECTORIZED              | MEMORY_READ               | -            |
| 245  | HOISTED, VECTORIZED, MEMORY_READ, INLINE       | MEMORY_WRITE, HOISTED, VECTORIZED, INLINE      | MEMORY_READ               | MEMORY_WRITE |
| 247  | MEMORY_WRITE, HOISTED, MEMORY_READ, VECTORIZED | HOISTED, VECTORIZED, MEMORY_READ               | MEMORY_WRITE              | -            |
| 253  | HOISTED, VECTORIZED, MEMORY_READ               | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -                         | MEMORY_WRITE |
| 255  | HOISTED, VECTORIZED                            | MEMORY_WRITE, HOISTED, VECTORIZED              | -                         | MEMORY_WRITE |
| 256  | HOISTED, VECTORIZED, MEMORY_READ               | MEMORY_WRITE, HOISTED, VECTORIZED              | MEMORY_READ               | MEMORY_WRITE |
| 258  | HOISTED, VECTORIZED, INLINE                    | HOISTED, VECTORIZED, MEMORY_READ, INLINE       | -                         | MEMORY_READ  |
| 263  | MEMORY_WRITE, HOISTED, VECTORIZED, INLINE      | MEMORY_WRITE, HOISTED, VECTORIZED              | INLINE                    | -            |
| 266  | MEMORY_WRITE, HOISTED, VECTORIZED, INLINE      | HOISTED, VECTORIZED, INLINE                    | MEMORY_WRITE              | -            |
| 270  | MEMORY_WRITE, HOISTED, VECTORIZED              | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -                         | MEMORY_READ  |
| 280  | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | HOISTED, VECTORIZED, MEMORY_READ               | MEMORY_WRITE              | -            |
| 282  | MEMORY_WRITE, HOISTED, VECTORIZED              | HOISTED, VECTORIZED                            | MEMORY_WRITE              | -            |
| 283  | MEMORY_WRITE, HOISTED, VECTORIZED              | HOISTED, VECTORIZED                            | MEMORY_WRITE              | -            |
| 285  | MEMORY_WRITE, HOISTED, VECTORIZED              | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -                         | MEMORY_READ  |
| 286  | HOISTED, MEMORY_READ, VECTORIZED               | MEMORY_WRITE, HOISTED, VECTORIZED              | MEMORY_READ               | MEMORY_WRITE |
| 290  | HOISTED, VECTORIZED, MEMORY_READ, INLINE       | HOISTED, VECTORIZED, INLINE                    | MEMORY_READ               | -            |
| 293  | HOISTED, VECTORIZED, MEMORY_READ, INLINE       | HOISTED, VECTORIZED, INLINE                    | MEMORY_READ               | -            |
| 312  | MEMORY_WRITE, HOISTED, VECTORIZED              | HOISTED, VECTORIZED, MEMORY_READ               | MEMORY_WRITE              | MEMORY_READ  |
| 313  | HOISTED, VECTORIZED, INLINE                    | HOISTED, VECTORIZED, MEMORY_READ               | INLINE                    | MEMORY_READ  |
| 315  | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | HOISTED, VECTORIZED, MEMORY_READ               | MEMORY_WRITE              | -            |
| 316  | HOISTED, VECTORIZED, INLINE                    | HOISTED, VECTORIZED, MEMORY_READ               | INLINE                    | MEMORY_READ  |
| 318  | MEMORY_WRITE, HOISTED, VECTORIZED              | HOISTED, VECTORIZED, MEMORY_READ               | MEMORY_WRITE              | MEMORY_READ  |
| 323  | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | HOISTED, VECTORIZED                            | MEMORY_WRITE, MEMORY_READ | -            |
| 324  | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | HOISTED, VECTORIZED                            | MEMORY_WRITE, MEMORY_READ | -            |
| 325  | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | HOISTED, VECTORIZED                            | MEMORY_WRITE, MEMORY_READ | -            |
| 327  | HOISTED, INLINE                                | HOISTED, VECTORIZED, INLINE                    | -                         | VECTORIZED   |
| 334  | MEMORY_WRITE, HOISTED, VECTORIZED              | HOISTED, MEMORY_READ, VECTORIZED               | MEMORY_WRITE              | MEMORY_READ  |
| 335  | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | HOISTED, MEMORY_READ, VECTORIZED               | MEMORY_WRITE              | -            |
| 336  | MEMORY_WRITE, HOISTED, MEMORY_READ, VECTORIZED | HOISTED, MEMORY_READ, VECTORIZED               | MEMORY_WRITE              | -            |
| 338  | HOISTED, VECTORIZED, INLINE                    | HOISTED, MEMORY_READ, VECTORIZED, INLINE       | -                         | MEMORY_READ  |


### src/apps/FEMSWEEP.hpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags                            |
| ---- | ------------------------------- |
| 222  | HOISTED, VECTORIZED             |
| 233  | VECTORIZED                      |
| 246  | VECTORIZED                      |
| 266  | MEMORY_WRITE, MEMORY_READ, CALL |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                                           |
| ---- | ---------------------------------------------- |
| 194  | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ |
| 198  | MEMORY_WRITE, HOISTED                          |
| 204  | MEMORY_WRITE, VECTORIZED, MEMORY_READ          |
| 223  | HOISTED, VECTORIZED, MEMORY_READ               |
| 234  | HOISTED, VECTORIZED, MEMORY_READ               |
| 244  | MEMORY_READ, VECTORIZED                        |
| 247  | HOISTED, MEMORY_READ, VECTORIZED               |
| 256  | VECTORIZED                                     |
| 259  | HOISTED, MEMORY_READ, VECTORIZED               |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                        | Only in O2               | Only in O3                       |
| ---- | ------------------------------------- | ---------------------------------------------- | ------------------------ | -------------------------------- |
| 173  | MEMORY_WRITE, MEMORY_READ, VECTORIZED | MEMORY_READ                                    | MEMORY_WRITE, VECTORIZED | -                                |
| 186  | VECTORIZED                            | VECTORIZED, MEMORY_READ                        | -                        | MEMORY_READ                      |
| 188  | HOISTED, VECTORIZED                   | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -                        | MEMORY_WRITE, MEMORY_READ        |
| 190  | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -                        | HOISTED                          |
| 191  | MEMORY_WRITE, HOISTED, VECTORIZED     | MEMORY_WRITE, HOISTED                          | VECTORIZED               | -                                |
| 192  | VECTORIZED                            | HOISTED, MEMORY_READ                           | VECTORIZED               | HOISTED, MEMORY_READ             |
| 206  | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -                        | HOISTED                          |
| 209  | MEMORY_WRITE                          | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -                        | VECTORIZED, MEMORY_READ          |
| 217  | VECTORIZED, MEMORY_READ               | MEMORY_WRITE, MEMORY_READ                      | VECTORIZED               | MEMORY_WRITE                     |
| 220  | MEMORY_WRITE                          | HOISTED, VECTORIZED, MEMORY_READ               | MEMORY_WRITE             | HOISTED, VECTORIZED, MEMORY_READ |
| 225  | VECTORIZED, MEMORY_READ               | HOISTED, VECTORIZED, MEMORY_READ               | -                        | HOISTED                          |
| 227  | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -                        | HOISTED                          |
| 231  | MEMORY_READ                           | HOISTED                                        | MEMORY_READ              | HOISTED                          |
| 236  | VECTORIZED, MEMORY_READ               | HOISTED, VECTORIZED, MEMORY_READ               | -                        | HOISTED                          |
| 249  | VECTORIZED, MEMORY_READ               | HOISTED, VECTORIZED, MEMORY_READ               | -                        | HOISTED                          |
| 251  | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -                        | HOISTED                          |
| 255  | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, VECTORIZED                       | MEMORY_READ              | -                                |
| 258  | VECTORIZED                            | HOISTED, VECTORIZED                            | -                        | HOISTED                          |
| 263  | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -                        | HOISTED                          |


### src/comm/HALO_base.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags         |
| ---- | ------------ |
| 243  | MEMORY_WRITE |
| 245  | MEMORY_WRITE |
| 250  | MEMORY_READ  |
| 251  | MEMORY_READ  |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                                           |
| ---- | ---------------------------------------------- |
| 223  | MEMORY_WRITE                                   |
| 225  | MEMORY_WRITE                                   |
| 228  | MEMORY_READ                                    |
| 237  | MEMORY_READ                                    |
| 264  | MEMORY_WRITE, HOISTED, MEMORY_READ, VECTORIZED |
| 266  | MEMORY_WRITE, HOISTED, VECTORIZED              |
| 267  | HOISTED, VECTORIZED, MEMORY_READ               |
| 272  | HOISTED                                        |
| 289  | MEMORY_WRITE, HOISTED, MEMORY_READ, VECTORIZED |
| 291  | MEMORY_WRITE, HOISTED, VECTORIZED              |
| 292  | HOISTED, VECTORIZED, MEMORY_READ               |
| 297  | HOISTED                                        |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                           | Only in O2               | Only in O3   |
| ---- | ------------------------------------- | --------------------------------- | ------------------------ | ------------ |
| 226  | VECTORIZED                            | MEMORY_READ                       | VECTORIZED               | MEMORY_READ  |
| 229  | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, MEMORY_READ         | VECTORIZED               | -            |
| 236  | VECTORIZED, MEMORY_READ               | MEMORY_READ                       | VECTORIZED               | -            |
| 238  | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_READ                       | MEMORY_WRITE, VECTORIZED | -            |
| 242  | HOISTED, MEMORY_READ                  | MEMORY_READ                       | HOISTED                  | -            |
| 259  | MEMORY_READ                           | MEMORY_WRITE, MEMORY_READ         | -                        | MEMORY_WRITE |
| 262  | MEMORY_READ                           | VECTORIZED, MEMORY_READ           | -                        | VECTORIZED   |
| 263  | MEMORY_WRITE, MEMORY_READ             | MEMORY_READ                       | MEMORY_WRITE             | -            |
| 270  | MEMORY_WRITE, HOISTED                 | MEMORY_WRITE, HOISTED, VECTORIZED | -                        | VECTORIZED   |
| 287  | MEMORY_WRITE, MEMORY_READ             | VECTORIZED, MEMORY_READ           | MEMORY_WRITE             | VECTORIZED   |
| 288  | MEMORY_WRITE, MEMORY_READ             | MEMORY_READ                       | MEMORY_WRITE             | -            |
| 295  | MEMORY_WRITE, HOISTED                 | MEMORY_WRITE, HOISTED, VECTORIZED | -                        | VECTORIZED   |
| 303  | MEMORY_WRITE, MEMORY_READ, CALL       | MEMORY_READ                       | MEMORY_WRITE, CALL       | -            |


### src/apps/INTSC_HEXRECT_BODY.hpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags                    |
| ---- | ----------------------- |
| 208  | VECTORIZED, MEMORY_READ |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                    |
| ---- | ----------------------- |
| 70   | VECTORIZED              |
| 96   | MEMORY_READ, VECTORIZED |
| 106  | VECTORIZED              |
| 114  | VECTORIZED, MEMORY_READ |
| 116  | MEMORY_READ, VECTORIZED |
| 222  | MEMORY_READ, VECTORIZED |
| 237  | MEMORY_READ, VECTORIZED |
| 239  | MEMORY_READ, VECTORIZED |
| 255  | MEMORY_READ, VECTORIZED |
| 278  | VECTORIZED              |
| 292  | VECTORIZED              |
| 295  | VECTORIZED              |
| 311  | VECTORIZED              |
| 313  | MEMORY_READ, VECTORIZED |
| 316  | MEMORY_READ, VECTORIZED |
| 318  | MEMORY_READ, VECTORIZED |
| 416  | VECTORIZED              |
| 418  | VECTORIZED              |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                               | Only in O2   | Only in O3   |
| ---- | ------------------------------------- | ------------------------------------- | ------------ | ------------ |
| 102  | VECTORIZED                            | MEMORY_WRITE, VECTORIZED              | -            | MEMORY_WRITE |
| 162  | MEMORY_WRITE, MEMORY_READ, VECTORIZED | VECTORIZED, MEMORY_READ               | MEMORY_WRITE | -            |
| 169  | VECTORIZED                            | MEMORY_READ, VECTORIZED               | -            | MEMORY_READ  |
| 332  | VECTORIZED                            | MEMORY_READ, VECTORIZED               | -            | MEMORY_READ  |
| 333  | VECTORIZED                            | MEMORY_READ, VECTORIZED               | -            | MEMORY_READ  |
| 346  | VECTORIZED                            | MEMORY_READ, VECTORIZED               | -            | MEMORY_READ  |
| 401  | VECTORIZED                            | MEMORY_WRITE, VECTORIZED              | -            | MEMORY_WRITE |
| 410  | MEMORY_READ, VECTORIZED               | MEMORY_WRITE, MEMORY_READ, VECTORIZED | -            | MEMORY_WRITE |
| 461  | MEMORY_WRITE, VECTORIZED              | MEMORY_READ, VECTORIZED               | MEMORY_WRITE | MEMORY_READ  |


### src/common/RunParams.hpp

**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags         |
| ---- | ------------ |
| 74   | MEMORY_WRITE |
| 133  | MEMORY_WRITE |
| 164  | MEMORY_WRITE |
| 185  | MEMORY_WRITE |
| 187  | MEMORY_WRITE |
| 193  | MEMORY_WRITE |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                 | O3 Tags                                 | Only in O2         | Only in O3   |
| ---- | --------------------------------------- | --------------------------------------- | ------------------ | ------------ |
| 68   | MEMORY_READ                             | MEMORY_WRITE, MEMORY_READ               | -                  | MEMORY_WRITE |
| 69   | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | MEMORY_WRITE, MEMORY_READ, INLINE       | CALL               | -            |
| 71   | MEMORY_WRITE, INLINE, CALL              | MEMORY_WRITE, INLINE                    | CALL               | -            |
| 73   | MEMORY_WRITE, INLINE, CALL              | MEMORY_WRITE, INLINE                    | CALL               | -            |
| 75   | MEMORY_WRITE, INLINE, CALL              | MEMORY_WRITE, INLINE                    | CALL               | -            |
| 97   | MEMORY_WRITE, INLINE, CALL              | INLINE                                  | MEMORY_WRITE, CALL | -            |
| 99   | MEMORY_WRITE, CALL                      | INLINE                                  | MEMORY_WRITE, CALL | INLINE       |
| 103  | MEMORY_WRITE, INLINE, CALL              | MEMORY_WRITE, CALL                      | INLINE             | -            |
| 132  | MEMORY_WRITE, INLINE, CALL              | INLINE                                  | MEMORY_WRITE, CALL | -            |
| 134  | MEMORY_WRITE, INLINE, CALL              | MEMORY_WRITE, INLINE                    | CALL               | -            |
| 153  | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_READ                             | MEMORY_WRITE, CALL | -            |
| 155  | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_READ                             | MEMORY_WRITE, CALL | -            |
| 158  | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_READ                             | MEMORY_WRITE, CALL | -            |
| 159  | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | -                  | INLINE       |
| 160  | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_READ                             | MEMORY_WRITE, CALL | -            |
| 162  | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_READ                             | MEMORY_WRITE, CALL | -            |
| 165  | MEMORY_WRITE, INLINE, CALL              | MEMORY_WRITE, INLINE                    | CALL               | -            |
| 186  | MEMORY_WRITE, INLINE, CALL              | MEMORY_WRITE, INLINE                    | CALL               | -            |
| 188  | MEMORY_WRITE, CALL                      | MEMORY_WRITE, INLINE                    | CALL               | INLINE       |
| 190  | MEMORY_WRITE, INLINE, CALL              | INLINE                                  | MEMORY_WRITE, CALL | -            |
| 192  | MEMORY_WRITE, INLINE, CALL              | INLINE                                  | MEMORY_WRITE, CALL | -            |
| 194  | MEMORY_WRITE, INLINE, CALL              | MEMORY_WRITE, INLINE                    | CALL               | -            |


### src/apps/MASS3DEA-Seq.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags                 |
| ---- | -------------------- |
| 102  | HOISTED, MEMORY_READ |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                                  |
| ---- | ------------------------------------- |
| 48   | VECTORIZED, MEMORY_READ               |
| 49   | MEMORY_WRITE, VECTORIZED, MEMORY_READ |
| 115  | VECTORIZED, MEMORY_READ               |
| 118  | VECTORIZED, MEMORY_READ               |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                            | O3 Tags                                        | Only in O2           | Only in O3                       |
| ---- | ---------------------------------- | ---------------------------------------------- | -------------------- | -------------------------------- |
| 36   | HOISTED, MEMORY_READ               | MEMORY_WRITE, HOISTED, MEMORY_READ             | -                    | MEMORY_WRITE                     |
| 40   | MEMORY_READ                        | VECTORIZED, MEMORY_READ                        | -                    | VECTORIZED                       |
| 50   | VECTORIZED, MEMORY_READ            | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -                    | MEMORY_WRITE                     |
| 56   | MEMORY_WRITE, HOISTED, MEMORY_READ | HOISTED, MEMORY_READ                           | MEMORY_WRITE         | -                                |
| 58   | MEMORY_WRITE, MEMORY_READ          | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -                    | VECTORIZED                       |
| 97   | MEMORY_READ                        | VECTORIZED, MEMORY_READ                        | -                    | VECTORIZED                       |
| 99   | HOISTED, MEMORY_READ               | HOISTED, VECTORIZED, MEMORY_READ               | -                    | VECTORIZED                       |
| 101  | HOISTED, MEMORY_READ, INLINE       | HOISTED, VECTORIZED, MEMORY_READ, INLINE       | -                    | VECTORIZED                       |
| 103  | HOISTED, MEMORY_READ, INLINE       | INLINE                                         | HOISTED, MEMORY_READ | -                                |
| 117  | INLINE                             | HOISTED, VECTORIZED, MEMORY_READ, INLINE       | -                    | HOISTED, VECTORIZED, MEMORY_READ |
| 119  | HOISTED, INLINE                    | HOISTED, VECTORIZED, MEMORY_READ, INLINE       | -                    | VECTORIZED, MEMORY_READ          |
| 120  | VECTORIZED, MEMORY_READ            | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -                    | MEMORY_WRITE                     |
| 121  | VECTORIZED, MEMORY_READ, INLINE    | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE  | -                    | MEMORY_WRITE                     |
| 122  | HOISTED, VECTORIZED, MEMORY_READ   | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -                    | MEMORY_WRITE                     |
| 136  | HOISTED, MEMORY_READ               | HOISTED, VECTORIZED, MEMORY_READ               | -                    | VECTORIZED                       |
| 137  | MEMORY_READ, INLINE                | VECTORIZED, MEMORY_READ, INLINE                | -                    | VECTORIZED                       |
| 138  | MEMORY_WRITE                       | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE         | VECTORIZED, MEMORY_READ          |


### src/polybench/POLYBENCH_3MM-Seq.cpp

**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                                          |
| ---- | --------------------------------------------- |
| 164  | VECTORIZED, MEMORY_READ, INLINE               |
| 175  | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                            | O3 Tags                                       | Only in O2   | Only in O3              |
| ---- | ---------------------------------- | --------------------------------------------- | ------------ | ----------------------- |
| 49   | MEMORY_WRITE, HOISTED, MEMORY_READ | HOISTED, MEMORY_READ                          | MEMORY_WRITE | -                       |
| 50   | VECTORIZED                         | HOISTED, VECTORIZED                           | -            | HOISTED                 |
| 52   | VECTORIZED, MEMORY_READ            | HOISTED, VECTORIZED, MEMORY_READ              | -            | HOISTED                 |
| 58   | HOISTED, MEMORY_READ               | MEMORY_WRITE, HOISTED, MEMORY_READ            | -            | MEMORY_WRITE            |
| 61   | HOISTED, MEMORY_READ               | MEMORY_WRITE, HOISTED, MEMORY_READ            | -            | MEMORY_WRITE            |
| 107  | MEMORY_WRITE, MEMORY_READ          | MEMORY_READ                                   | MEMORY_WRITE | -                       |
| 109  | MEMORY_READ                        | MEMORY_WRITE, MEMORY_READ                     | -            | MEMORY_WRITE            |
| 117  | MEMORY_WRITE                       | MEMORY_READ                                   | MEMORY_WRITE | MEMORY_READ             |
| 119  | MEMORY_READ                        | MEMORY_WRITE, MEMORY_READ                     | -            | MEMORY_WRITE            |
| 126  | MEMORY_READ                        | MEMORY_WRITE, MEMORY_READ                     | -            | MEMORY_WRITE            |
| 129  | MEMORY_READ                        | MEMORY_WRITE, MEMORY_READ                     | -            | MEMORY_WRITE            |
| 153  | VECTORIZED, MEMORY_READ            | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE | -            | MEMORY_WRITE, INLINE    |
| 159  | MEMORY_WRITE, MEMORY_READ, CALL    | MEMORY_WRITE, CALL                            | MEMORY_READ  | -                       |
| 160  | VECTORIZED, MEMORY_READ            | VECTORIZED                                    | MEMORY_READ  | -                       |
| 162  | MEMORY_WRITE, CALL                 | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL   | -            | VECTORIZED, MEMORY_READ |
| 170  | MEMORY_WRITE, MEMORY_READ, CALL    | MEMORY_WRITE, CALL                            | MEMORY_READ  | -                       |
| 171  | VECTORIZED, MEMORY_READ            | VECTORIZED                                    | MEMORY_READ  | -                       |
| 173  | MEMORY_WRITE, CALL                 | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL   | -            | VECTORIZED, MEMORY_READ |
| 199  | MEMORY_READ, INLINE                | MEMORY_WRITE, INLINE                          | MEMORY_READ  | MEMORY_WRITE            |
| 212  | MEMORY_READ, INLINE                | MEMORY_WRITE, INLINE                          | MEMORY_READ  | MEMORY_WRITE            |


### src/apps/AppsData.cpp

**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                                           |
| ---- | ---------------------------------------------- |
| 70   | MEMORY_READ                                    |
| 72   | VECTORIZED                                     |
| 75   | HOISTED, MEMORY_READ, VECTORIZED               |
| 102  | MEMORY_READ                                    |
| 105  | MEMORY_WRITE                                   |
| 110  | MEMORY_WRITE, HOISTED, MEMORY_READ, VECTORIZED |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                        | O3 Tags                                        | Only in O2   | Only in O3               |
| ---- | ---------------------------------------------- | ---------------------------------------------- | ------------ | ------------------------ |
| 76   | MEMORY_WRITE, HOISTED                          | MEMORY_WRITE, HOISTED, VECTORIZED              | -            | VECTORIZED               |
| 78   | MEMORY_WRITE, HOISTED                          | HOISTED, VECTORIZED                            | MEMORY_WRITE | VECTORIZED               |
| 79   | MEMORY_WRITE, HOISTED                          | MEMORY_WRITE, HOISTED, VECTORIZED              | -            | VECTORIZED               |
| 96   | MEMORY_READ                                    | MEMORY_WRITE, MEMORY_READ                      | -            | MEMORY_WRITE             |
| 98   | MEMORY_READ                                    | MEMORY_WRITE, MEMORY_READ                      | -            | MEMORY_WRITE             |
| 106  | MEMORY_WRITE, MEMORY_READ                      | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -            | VECTORIZED               |
| 109  | MEMORY_READ                                    | MEMORY_WRITE, MEMORY_READ, VECTORIZED          | -            | MEMORY_WRITE, VECTORIZED |
| 111  | MEMORY_WRITE, HOISTED                          | MEMORY_WRITE, HOISTED, VECTORIZED              | -            | VECTORIZED               |
| 113  | MEMORY_WRITE, HOISTED                          | HOISTED, VECTORIZED                            | MEMORY_WRITE | VECTORIZED               |
| 114  | MEMORY_WRITE, HOISTED                          | MEMORY_WRITE, HOISTED, VECTORIZED              | -            | VECTORIZED               |
| 137  | MEMORY_READ                                    | VECTORIZED, MEMORY_READ                        | -            | VECTORIZED               |
| 175  | MEMORY_READ                                    | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -            | MEMORY_WRITE, VECTORIZED |
| 182  | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | HOISTED, VECTORIZED, MEMORY_READ               | MEMORY_WRITE | -                        |
| 183  | MEMORY_WRITE, HOISTED                          | HOISTED, VECTORIZED, MEMORY_READ               | MEMORY_WRITE | VECTORIZED, MEMORY_READ  |
| 190  | MEMORY_WRITE, HOISTED, VECTORIZED              | MEMORY_WRITE, HOISTED, MEMORY_READ, VECTORIZED | -            | MEMORY_READ              |


### src/polybench/POLYBENCH_FDTD_2D-Seq.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags                      |
| ---- | ------------------------- |
| 28   | MEMORY_WRITE              |
| 91   | MEMORY_WRITE, MEMORY_READ |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                      |
| ---- | ------------------------- |
| 44   | MEMORY_WRITE, MEMORY_READ |
| 95   | MEMORY_WRITE, MEMORY_READ |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                             | Only in O2                | Only in O3               |
| ---- | ------------------------------------- | --------------------------------------------------- | ------------------------- | ------------------------ |
| 39   | MEMORY_READ                           | MEMORY_WRITE, MEMORY_READ                           | -                         | MEMORY_WRITE             |
| 40   | MEMORY_WRITE, HOISTED, MEMORY_READ    | HOISTED                                             | MEMORY_WRITE, MEMORY_READ | -                        |
| 45   | HOISTED, MEMORY_READ                  | HOISTED, VECTORIZED, MEMORY_READ                    | -                         | VECTORIZED               |
| 46   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ      | -                         | HOISTED                  |
| 49   | MEMORY_READ                           | MEMORY_WRITE, MEMORY_READ                           | -                         | MEMORY_WRITE             |
| 51   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ      | -                         | HOISTED                  |
| 88   | VECTORIZED, MEMORY_READ, INLINE       | MEMORY_WRITE, MEMORY_READ, VECTORIZED, INLINE       | -                         | MEMORY_WRITE             |
| 90   | MEMORY_READ                           | MEMORY_WRITE, MEMORY_READ                           | -                         | MEMORY_WRITE             |
| 96   | MEMORY_READ                           | VECTORIZED, MEMORY_READ                             | -                         | VECTORIZED               |
| 100  | MEMORY_READ                           | MEMORY_WRITE, MEMORY_READ                           | -                         | MEMORY_WRITE             |
| 125  | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_READ, MEMORY_WRITE, INLINE, VECTORIZED, CALL | -                         | INLINE, CALL             |
| 128  | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE       | -                         | INLINE                   |
| 131  | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE       | -                         | INLINE                   |
| 134  | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE       | -                         | INLINE                   |
| 172  | MEMORY_READ                           | MEMORY_WRITE, VECTORIZED, MEMORY_READ               | -                         | MEMORY_WRITE, VECTORIZED |
| 173  | INLINE                                | MEMORY_WRITE, INLINE                                | -                         | MEMORY_WRITE             |


### src/polybench/POLYBENCH_GEMVER-Seq.cpp

**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                      |
| ---- | ------------------------- |
| 46   | HOISTED                   |
| 106  | MEMORY_WRITE, MEMORY_READ |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                             | Only in O2                | Only in O3                         |
| ---- | ------------------------------------- | --------------------------------------------------- | ------------------------- | ---------------------------------- |
| 39   | MEMORY_WRITE, HOISTED, MEMORY_READ    | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ      | -                         | VECTORIZED                         |
| 40   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ      | -                         | HOISTED                            |
| 44   | MEMORY_READ                           | HOISTED, MEMORY_READ, VECTORIZED                    | -                         | HOISTED, VECTORIZED                |
| 45   | VECTORIZED                            | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ      | -                         | MEMORY_WRITE, HOISTED, MEMORY_READ |
| 47   | VECTORIZED, MEMORY_READ               | HOISTED, VECTORIZED, MEMORY_READ                    | -                         | HOISTED                            |
| 49   | MEMORY_WRITE, VECTORIZED              | MEMORY_WRITE, HOISTED, VECTORIZED                   | -                         | HOISTED                            |
| 52   | MEMORY_WRITE, MEMORY_READ             | HOISTED, VECTORIZED                                 | MEMORY_WRITE, MEMORY_READ | HOISTED, VECTORIZED                |
| 53   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ      | -                         | HOISTED                            |
| 58   | MEMORY_WRITE, HOISTED, MEMORY_READ    | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ      | -                         | VECTORIZED                         |
| 99   | MEMORY_WRITE, MEMORY_READ             | MEMORY_WRITE, VECTORIZED, MEMORY_READ               | -                         | VECTORIZED                         |
| 104  | MEMORY_READ                           | MEMORY_WRITE, MEMORY_READ, VECTORIZED               | -                         | MEMORY_WRITE, VECTORIZED           |
| 105  | VECTORIZED                            | VECTORIZED, MEMORY_READ                             | -                         | MEMORY_READ                        |
| 112  | MEMORY_WRITE, MEMORY_READ             | VECTORIZED                                          | MEMORY_WRITE, MEMORY_READ | VECTORIZED                         |
| 137  | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE       | -                         | INLINE                             |
| 140  | VECTORIZED                            | MEMORY_READ, VECTORIZED                             | -                         | MEMORY_READ                        |
| 143  | VECTORIZED, MEMORY_READ               | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE       | -                         | MEMORY_WRITE, INLINE               |
| 149  | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_READ, MEMORY_WRITE, INLINE, VECTORIZED, CALL | -                         | INLINE, CALL                       |


### src/basic/REDUCE3_INT-Seq.cpp

**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                     |
| ---- | ------------------------ |
| 46   | MEMORY_WRITE, VECTORIZED |
| 75   | MEMORY_WRITE, VECTORIZED |
| 77   | VECTORIZED               |
| 78   | VECTORIZED               |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                 | O3 Tags                                             | Only in O2   | Only in O3          |
| ---- | --------------------------------------- | --------------------------------------------------- | ------------ | ------------------- |
| 32   | MEMORY_WRITE, MEMORY_READ               | MEMORY_READ                                         | MEMORY_WRITE | -                   |
| 43   | HOISTED, MEMORY_READ                    | HOISTED, VECTORIZED, MEMORY_READ                    | -            | VECTORIZED          |
| 44   | HOISTED, MEMORY_READ                    | HOISTED, VECTORIZED, MEMORY_READ                    | -            | VECTORIZED          |
| 47   | MEMORY_READ                             | HOISTED, VECTORIZED, MEMORY_READ                    | -            | HOISTED, VECTORIZED |
| 63   | MEMORY_READ                             | VECTORIZED, MEMORY_READ                             | -            | VECTORIZED          |
| 64   | MEMORY_READ                             | VECTORIZED, MEMORY_READ                             | -            | VECTORIZED          |
| 72   | MEMORY_READ                             | VECTORIZED, MEMORY_READ                             | -            | VECTORIZED          |
| 73   | MEMORY_READ                             | VECTORIZED, MEMORY_READ                             | -            | VECTORIZED          |
| 76   | INLINE                                  | VECTORIZED, INLINE                                  | -            | VECTORIZED          |
| 106  | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | MEMORY_READ, MEMORY_WRITE, INLINE, VECTORIZED, CALL | -            | VECTORIZED          |
| 107  | MEMORY_READ, INLINE                     | VECTORIZED, MEMORY_READ, INLINE                     | -            | VECTORIZED          |
| 124  | MEMORY_READ                             | MEMORY_WRITE, MEMORY_READ                           | -            | MEMORY_WRITE        |
| 132  | MEMORY_READ                             | VECTORIZED, MEMORY_READ                             | -            | VECTORIZED          |
| 141  | MEMORY_WRITE                            | MEMORY_WRITE, MEMORY_READ                           | -            | MEMORY_READ         |


### src/polybench/POLYBENCH_HEAT_3D-Seq.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags         |
| ---- | ------------ |
| 103  | MEMORY_WRITE |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                               |
| ---- | ---------------------------------- |
| 39   | MEMORY_WRITE, HOISTED, MEMORY_READ |
| 77   | MEMORY_WRITE, MEMORY_READ          |
| 85   | MEMORY_WRITE, MEMORY_READ          |
| 124  | VECTORIZED, MEMORY_READ            |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                        | O3 Tags                                        | Only in O2         | Only in O3                |
| ---- | ---------------------------------------------- | ---------------------------------------------- | ------------------ | ------------------------- |
| 37   | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, MEMORY_READ             | VECTORIZED         | -                         |
| 38   | MEMORY_WRITE, HOISTED, MEMORY_READ             | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -                  | VECTORIZED                |
| 45   | MEMORY_WRITE, MEMORY_READ                      | MEMORY_WRITE, HOISTED, MEMORY_READ             | -                  | HOISTED                   |
| 46   | MEMORY_WRITE, HOISTED                          | MEMORY_WRITE, HOISTED, MEMORY_READ             | -                  | MEMORY_READ               |
| 47   | HOISTED                                        | MEMORY_WRITE, HOISTED, MEMORY_READ             | -                  | MEMORY_WRITE, MEMORY_READ |
| 75   | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | MEMORY_WRITE, MEMORY_READ                      | VECTORIZED         | -                         |
| 76   | MEMORY_WRITE, MEMORY_READ                      | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -                  | VECTORIZED                |
| 84   | MEMORY_WRITE                                   | MEMORY_WRITE, MEMORY_READ                      | -                  | MEMORY_READ               |
| 101  | MEMORY_WRITE, INLINE, CALL                     | MEMORY_READ, INLINE                            | MEMORY_WRITE, CALL | MEMORY_READ               |
| 114  | MEMORY_WRITE, INLINE                           | INLINE                                         | MEMORY_WRITE       | -                         |
| 118  | MEMORY_READ, INLINE                            | MEMORY_WRITE, INLINE                           | MEMORY_READ        | MEMORY_WRITE              |
| 125  | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE  | -                  | INLINE                    |
| 130  | MEMORY_READ, INLINE                            | MEMORY_WRITE, INLINE                           | MEMORY_READ        | MEMORY_WRITE              |


### tpl/RAJA/include/RAJA/pattern/detail/reduce.hpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags                                        |
| ---- | ------------------------------------------- |
| 172  | VECTORIZED, MEMORY_READ                     |
| 174  | VECTORIZED, MEMORY_READ                     |
| 333  | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL |
| 435  | MEMORY_READ                                 |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                       | O3 Tags                                             | Only in O2               | Only in O3         |
| ---- | --------------------------------------------- | --------------------------------------------------- | ------------------------ | ------------------ |
| 163  | MEMORY_WRITE, VECTORIZED                      | MEMORY_WRITE, VECTORIZED, CALL                      | -                        | CALL               |
| 238  | MEMORY_WRITE, MEMORY_READ, VECTORIZED         | MEMORY_WRITE, VECTORIZED, CALL                      | MEMORY_READ              | CALL               |
| 258  | MEMORY_WRITE, MEMORY_READ, VECTORIZED, INLINE | MEMORY_READ, MEMORY_WRITE, INLINE, VECTORIZED, CALL | -                        | CALL               |
| 273  | MEMORY_READ, VECTORIZED, INLINE               | MEMORY_WRITE, MEMORY_READ, VECTORIZED, INLINE       | -                        | MEMORY_WRITE       |
| 301  | MEMORY_WRITE, MEMORY_READ, VECTORIZED         | MEMORY_WRITE, VECTORIZED, CALL                      | MEMORY_READ              | CALL               |
| 318  | MEMORY_WRITE, MEMORY_READ, VECTORIZED         | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL         | -                        | CALL               |
| 329  | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE | MEMORY_READ, MEMORY_WRITE, INLINE, VECTORIZED, CALL | -                        | CALL               |
| 331  | MEMORY_WRITE, VECTORIZED, INLINE              | INLINE                                              | MEMORY_WRITE, VECTORIZED | -                  |
| 338  | MEMORY_READ, VECTORIZED, INLINE               | MEMORY_WRITE, MEMORY_READ, VECTORIZED, INLINE       | -                        | MEMORY_WRITE       |
| 396  | VECTORIZED, MEMORY_READ, INLINE               | MEMORY_READ, MEMORY_WRITE, INLINE, VECTORIZED, CALL | -                        | MEMORY_WRITE, CALL |
| 407  | MEMORY_WRITE                                  | MEMORY_WRITE, CALL                                  | -                        | CALL               |
| 457  | VECTORIZED, MEMORY_READ                       | MEMORY_WRITE, VECTORIZED                            | MEMORY_READ              | MEMORY_WRITE       |
| 472  | MEMORY_WRITE, MEMORY_READ, VECTORIZED, INLINE | MEMORY_READ, MEMORY_WRITE, INLINE, VECTORIZED, CALL | -                        | CALL               |
| 476  | MEMORY_WRITE, MEMORY_READ, VECTORIZED, INLINE | MEMORY_WRITE, VECTORIZED, INLINE, CALL              | MEMORY_READ              | CALL               |


### tpl/RAJA/include/RAJA/util/sort.hpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags       |
| ---- | ---------- |
| 45   | VECTORIZED |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                    |
| ---- | ----------------------- |
| 113  | HOISTED                 |
| 288  | INLINE                  |
| 357  | MEMORY_READ             |
| 368  | MEMORY_WRITE            |
| 399  | VECTORIZED, MEMORY_READ |
| 402  | INLINE                  |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                | O3 Tags                                  | Only in O2  | Only in O3   |
| ---- | -------------------------------------- | ---------------------------------------- | ----------- | ------------ |
| 61   | VECTORIZED, MEMORY_READ, INLINE        | HOISTED, VECTORIZED, MEMORY_READ, INLINE | -           | HOISTED      |
| 78   | MEMORY_READ, VECTORIZED, INLINE        | HOISTED, MEMORY_READ, VECTORIZED, INLINE | -           | HOISTED      |
| 84   | INLINE                                 | HOISTED, INLINE                          | -           | HOISTED      |
| 119  | MEMORY_READ, VECTORIZED, INLINE        | HOISTED, MEMORY_READ, VECTORIZED, INLINE | -           | HOISTED      |
| 265  | HOISTED, VECTORIZED, MEMORY_READ       | HOISTED, MEMORY_READ, VECTORIZED, INLINE | -           | INLINE       |
| 343  | MEMORY_WRITE, MEMORY_READ              | MEMORY_WRITE, MEMORY_READ, INLINE        | -           | INLINE       |
| 351  | INLINE                                 | MEMORY_WRITE                             | INLINE      | MEMORY_WRITE |
| 379  | INLINE                                 | MEMORY_READ, INLINE                      | -           | MEMORY_READ  |
| 381  | VECTORIZED, INLINE                     | VECTORIZED                               | INLINE      | -            |
| 383  | MEMORY_READ, VECTORIZED, INLINE        | VECTORIZED, INLINE                       | MEMORY_READ | -            |
| 407  | MEMORY_WRITE, VECTORIZED, INLINE, CALL | MEMORY_WRITE, MEMORY_READ, INLINE, CALL  | VECTORIZED  | MEMORY_READ  |


### src/lcals/HYDRO_2D-Seq.cpp

**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                               |
| ---- | ---------------------------------- |
| 27   | MEMORY_WRITE                       |
| 56   | MEMORY_WRITE, HOISTED, MEMORY_READ |
| 97   | MEMORY_READ                        |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                        | Only in O2   | Only in O3              |
| ---- | ------------------------------------- | ---------------------------------------------- | ------------ | ----------------------- |
| 28   | MEMORY_READ                           | MEMORY_WRITE, MEMORY_READ                      | -            | MEMORY_WRITE            |
| 44   | MEMORY_WRITE, HOISTED, MEMORY_READ    | HOISTED, MEMORY_READ                           | MEMORY_WRITE | -                       |
| 49   | MEMORY_WRITE, MEMORY_READ             | MEMORY_WRITE, HOISTED, MEMORY_READ             | -            | HOISTED                 |
| 50   | MEMORY_READ                           | HOISTED, MEMORY_READ                           | -            | HOISTED                 |
| 51   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -            | HOISTED                 |
| 55   | MEMORY_READ                           | MEMORY_WRITE, HOISTED, MEMORY_READ             | -            | MEMORY_WRITE, HOISTED   |
| 57   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -            | HOISTED                 |
| 82   | MEMORY_WRITE, HOISTED, MEMORY_READ    | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -            | VECTORIZED              |
| 85   | MEMORY_WRITE, HOISTED, MEMORY_READ    | HOISTED, MEMORY_READ                           | MEMORY_WRITE | -                       |
| 96   | MEMORY_READ                           | MEMORY_WRITE, MEMORY_READ                      | -            | MEMORY_WRITE            |
| 114  | MEMORY_WRITE, CALL                    | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL    | -            | VECTORIZED, MEMORY_READ |
| 121  | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE  | -            | INLINE                  |
| 135  | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, MEMORY_READ                      | VECTORIZED   | -                       |


### src/apps/ENERGY-Seq.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags                     |
| ---- | ------------------------ |
| 112  | MEMORY_WRITE, VECTORIZED |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                        | O3 Tags                                        | Only in O2               | Only in O3               |
| ---- | ---------------------------------------------- | ---------------------------------------------- | ------------------------ | ------------------------ |
| 32   | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL    | -                        | CALL                     |
| 38   | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL    | -                        | CALL                     |
| 41   | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL    | -                        | CALL                     |
| 57   | MEMORY_WRITE, MEMORY_READ                      | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -                        | VECTORIZED               |
| 59   | HOISTED, VECTORIZED, MEMORY_READ               | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -                        | MEMORY_WRITE             |
| 63   | MEMORY_WRITE, HOISTED                          | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | HOISTED                  | VECTORIZED, MEMORY_READ  |
| 67   | HOISTED, VECTORIZED, MEMORY_READ               | VECTORIZED, MEMORY_READ                        | HOISTED                  | -                        |
| 71   | HOISTED, MEMORY_READ                           | MEMORY_WRITE, HOISTED, MEMORY_READ, VECTORIZED | -                        | MEMORY_WRITE, VECTORIZED |
| 75   | MEMORY_WRITE, HOISTED, MEMORY_READ, VECTORIZED | HOISTED, MEMORY_READ                           | MEMORY_WRITE, VECTORIZED | -                        |
| 94   | MEMORY_WRITE, MEMORY_READ                      | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -                        | VECTORIZED               |
| 96   | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -                        | MEMORY_WRITE             |
| 100  | MEMORY_WRITE                                   | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -                        | VECTORIZED, MEMORY_READ  |
| 108  | VECTORIZED, MEMORY_READ                        | MEMORY_WRITE, MEMORY_READ, VECTORIZED          | -                        | MEMORY_WRITE             |
| 116  | MEMORY_READ, VECTORIZED                        | VECTORIZED                                     | MEMORY_READ              | -                        |


### src/./common/KernelBase.hpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags        |
| ---- | ----------- |
| 263  | MEMORY_READ |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags         |
| ---- | ------------ |
| 327  | MEMORY_WRITE |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                 | O3 Tags                           | Only in O2   | Only in O3   |
| ---- | --------------------------------------- | --------------------------------- | ------------ | ------------ |
| 261  | MEMORY_READ                             | MEMORY_WRITE, MEMORY_READ         | -            | MEMORY_WRITE |
| 262  | MEMORY_READ, INLINE                     | MEMORY_WRITE, MEMORY_READ, INLINE | -            | MEMORY_WRITE |
| 264  | MEMORY_READ, INLINE                     | INLINE                            | MEMORY_READ  | -            |
| 265  | MEMORY_READ                             | MEMORY_WRITE, MEMORY_READ         | -            | MEMORY_WRITE |
| 278  | MEMORY_WRITE, MEMORY_READ, INLINE       | MEMORY_READ, INLINE               | MEMORY_WRITE | -            |
| 326  | MEMORY_WRITE, MEMORY_READ               | MEMORY_WRITE                      | MEMORY_READ  | -            |
| 492  | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | MEMORY_WRITE, INLINE, CALL        | MEMORY_READ  | -            |
| 540  | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_WRITE, CALL                | MEMORY_READ  | -            |
| 542  | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | MEMORY_WRITE, INLINE, CALL        | MEMORY_READ  | -            |
| 547  | MEMORY_WRITE, MEMORY_READ               | MEMORY_WRITE, MEMORY_READ, CALL   | -            | CALL         |
| 599  | MEMORY_WRITE, CALL                      | MEMORY_WRITE, MEMORY_READ, CALL   | -            | MEMORY_READ  |
| 611  | VECTORIZED, MEMORY_READ                 | MEMORY_READ                       | VECTORIZED   | -            |


### src/apps/LTIMES-Seq.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags                 |
| ---- | -------------------- |
| 40   | HOISTED, MEMORY_READ |
| 67   | MEMORY_READ          |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                    |
| ---- | ----------------------- |
| 140  | MEMORY_READ             |
| 142  | MEMORY_WRITE            |
| 144  | VECTORIZED, MEMORY_READ |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                       | O3 Tags                                             | Only in O2            | Only in O3   |
| ---- | --------------------------------------------- | --------------------------------------------------- | --------------------- | ------------ |
| 39   | MEMORY_WRITE, HOISTED, MEMORY_READ            | MEMORY_WRITE, MEMORY_READ                           | HOISTED               | -            |
| 41   | MEMORY_WRITE, HOISTED, MEMORY_READ            | VECTORIZED, MEMORY_READ                             | MEMORY_WRITE, HOISTED | VECTORIZED   |
| 68   | MEMORY_READ                                   | VECTORIZED, MEMORY_READ                             | -                     | VECTORIZED   |
| 133  | MEMORY_WRITE, MEMORY_READ                     | MEMORY_WRITE, VECTORIZED, MEMORY_READ               | -                     | VECTORIZED   |
| 135  | MEMORY_WRITE, MEMORY_READ, INLINE, CALL       | MEMORY_READ, MEMORY_WRITE, INLINE, VECTORIZED, CALL | -                     | VECTORIZED   |
| 147  | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE | MEMORY_WRITE, VECTORIZED, MEMORY_READ               | INLINE                | -            |
| 170  | MEMORY_WRITE, MEMORY_READ, INLINE, CALL       | MEMORY_WRITE, INLINE, CALL                          | MEMORY_READ           | -            |
| 192  | INLINE                                        | MEMORY_WRITE, INLINE                                | -                     | MEMORY_WRITE |


### src/apps/MASS3DPA_ATOMIC.cpp

**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                                           |
| ---- | ---------------------------------------------- |
| 153  | MEMORY_WRITE, VECTORIZED, MEMORY_READ          |
| 171  | HOISTED                                        |
| 172  | MEMORY_WRITE, HOISTED, MEMORY_READ, VECTORIZED |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                            | O3 Tags                                        | Only in O2   | Only in O3              |
| ---- | ---------------------------------- | ---------------------------------------------- | ------------ | ----------------------- |
| 156  | MEMORY_WRITE, MEMORY_READ          | MEMORY_READ                                    | MEMORY_WRITE | -                       |
| 160  | HOISTED                            | MEMORY_WRITE                                   | HOISTED      | MEMORY_WRITE            |
| 163  | HOISTED                            | MEMORY_WRITE                                   | HOISTED      | MEMORY_WRITE            |
| 165  | HOISTED                            | MEMORY_WRITE                                   | HOISTED      | MEMORY_WRITE            |
| 168  | MEMORY_WRITE, HOISTED, MEMORY_READ | MEMORY_WRITE, MEMORY_READ, VECTORIZED          | HOISTED      | VECTORIZED              |
| 170  | MEMORY_WRITE                       | MEMORY_WRITE, MEMORY_READ, VECTORIZED          | -            | MEMORY_READ, VECTORIZED |
| 173  | MEMORY_WRITE, HOISTED              | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -            | VECTORIZED, MEMORY_READ |
| 175  | MEMORY_WRITE, HOISTED              | MEMORY_WRITE, HOISTED, VECTORIZED              | -            | VECTORIZED              |
| 178  | MEMORY_WRITE, HOISTED              | HOISTED, VECTORIZED                            | MEMORY_WRITE | VECTORIZED              |
| 180  | MEMORY_WRITE, HOISTED              | MEMORY_WRITE, HOISTED, MEMORY_READ, VECTORIZED | -            | MEMORY_READ, VECTORIZED |


### src/./common/DataUtils.hpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags        |
| ---- | ----------- |
| 320  | MEMORY_READ |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                      |
| ---- | ------------------------- |
| 106  | MEMORY_WRITE, VECTORIZED  |
| 310  | MEMORY_WRITE, MEMORY_READ |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                 | O3 Tags                                     | Only in O2                      | Only in O3                 |
| ---- | --------------------------------------- | ------------------------------------------- | ------------------------------- | -------------------------- |
| 108  | MEMORY_WRITE, VECTORIZED, MEMORY_READ   | MEMORY_WRITE, MEMORY_READ, VECTORIZED, CALL | -                               | CALL                       |
| 210  | MEMORY_WRITE, MEMORY_READ               | MEMORY_WRITE                                | MEMORY_READ                     | -                          |
| 294  | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | INLINE                                      | MEMORY_WRITE, MEMORY_READ, CALL | -                          |
| 300  | MEMORY_READ                             | MEMORY_WRITE, MEMORY_READ                   | -                               | MEMORY_WRITE               |
| 318  | MEMORY_READ                             | MEMORY_WRITE, MEMORY_READ, INLINE, CALL     | -                               | MEMORY_WRITE, INLINE, CALL |
| 487  | MEMORY_WRITE, INLINE                    | MEMORY_WRITE, MEMORY_READ, INLINE           | -                               | MEMORY_READ                |
| 503  | MEMORY_READ                             | MEMORY_WRITE, MEMORY_READ, CALL             | -                               | MEMORY_WRITE, CALL         |
| 505  | MEMORY_READ                             | MEMORY_WRITE, MEMORY_READ, CALL             | -                               | MEMORY_WRITE, CALL         |
| 508  | MEMORY_WRITE, MEMORY_READ, CALL         | MEMORY_WRITE, MEMORY_READ, INLINE, CALL     | -                               | INLINE                     |


### src/apps/LTIMES_NOVIEW-Seq.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags                      |
| ---- | ------------------------- |
| 66   | MEMORY_WRITE, MEMORY_READ |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                    |
| ---- | ----------------------- |
| 67   | VECTORIZED, MEMORY_READ |
| 140  | MEMORY_READ             |
| 142  | MEMORY_WRITE            |
| 144  | VECTORIZED, MEMORY_READ |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags               | O3 Tags                            | Only in O2   | Only in O3              |
| ---- | --------------------- | ---------------------------------- | ------------ | ----------------------- |
| 37   | MEMORY_WRITE, HOISTED | MEMORY_WRITE, HOISTED, MEMORY_READ | -            | MEMORY_READ             |
| 38   | HOISTED, MEMORY_READ  | HOISTED                            | MEMORY_READ  | -                       |
| 39   | MEMORY_WRITE, HOISTED | HOISTED, VECTORIZED, MEMORY_READ   | MEMORY_WRITE | VECTORIZED, MEMORY_READ |
| 64   | MEMORY_READ           | MEMORY_WRITE, MEMORY_READ          | -            | MEMORY_WRITE            |
| 65   | MEMORY_READ           | MEMORY_WRITE, MEMORY_READ          | -            | MEMORY_WRITE            |
| 141  | MEMORY_READ, INLINE   | INLINE                             | MEMORY_READ  | -                       |
| 192  | INLINE                | MEMORY_WRITE, INLINE               | -            | MEMORY_WRITE            |


### src/apps/VOL3D-Seq.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags        |
| ---- | ----------- |
| 35   | MEMORY_READ |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                          | O3 Tags                                        | Only in O2         | Only in O3            |
| ---- | ------------------------------------------------ | ---------------------------------------------- | ------------------ | --------------------- |
| 28   | MEMORY_READ                                      | MEMORY_WRITE, MEMORY_READ                      | -                  | MEMORY_WRITE          |
| 33   | MEMORY_READ                                      | VECTORIZED, MEMORY_READ                        | -                  | VECTORIZED            |
| 34   | MEMORY_WRITE, VECTORIZED, MEMORY_READ            | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL    | -                  | CALL                  |
| 40   | MEMORY_WRITE                                     | MEMORY_WRITE, CALL                             | -                  | CALL                  |
| 42   | MEMORY_WRITE, INLINE                             | MEMORY_WRITE, INLINE, CALL                     | -                  | CALL                  |
| 44   | MEMORY_WRITE, MEMORY_READ                        | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -                  | VECTORIZED            |
| 46   | MEMORY_READ                                      | MEMORY_WRITE, HOISTED, MEMORY_READ             | -                  | MEMORY_WRITE, HOISTED |
| 47   | MEMORY_WRITE, VECTORIZED, MEMORY_READ            | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -                  | HOISTED               |
| 61   | MEMORY_WRITE, MEMORY_READ                        | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -                  | VECTORIZED            |
| 64   | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL      | VECTORIZED, MEMORY_READ, INLINE                | MEMORY_WRITE, CALL | INLINE                |
| 92   | MEMORY_READ, MEMORY_WRITE, HOISTED, INLINE, CALL | MEMORY_WRITE, HOISTED, INLINE, CALL            | MEMORY_READ        | -                     |


### src/lcals/GEN_LIN_RECUR-Seq.cpp

**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                               |
| ---- | ---------------------------------- |
| 49   | MEMORY_WRITE, HOISTED, MEMORY_READ |
| 70   | MEMORY_READ                        |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                        | Only in O2   | Only in O3   |
| ---- | ------------------------------------- | ---------------------------------------------- | ------------ | ------------ |
| 26   | MEMORY_READ                           | MEMORY_WRITE, MEMORY_READ                      | -            | MEMORY_WRITE |
| 30   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL    | -            | CALL         |
| 33   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL    | -            | CALL         |
| 39   | MEMORY_WRITE                          | MEMORY_WRITE, CALL                             | -            | CALL         |
| 41   | MEMORY_WRITE, INLINE                  | MEMORY_WRITE, INLINE, CALL                     | -            | CALL         |
| 45   | HOISTED, MEMORY_READ                  | MEMORY_WRITE, HOISTED, MEMORY_READ             | -            | MEMORY_WRITE |
| 46   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -            | HOISTED      |
| 50   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -            | HOISTED      |
| 66   | MEMORY_READ                           | MEMORY_WRITE, MEMORY_READ                      | -            | MEMORY_WRITE |
| 92   | MEMORY_WRITE, INLINE                  | MEMORY_READ, INLINE                            | MEMORY_WRITE | MEMORY_READ  |


### src/comm/HALO_PACKING-Seq.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags         |
| ---- | ------------ |
| 28   | MEMORY_WRITE |
| 54   | MEMORY_READ  |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags        |
| ---- | ----------- |
| 93   | MEMORY_READ |
| 117  | MEMORY_READ |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                  | O3 Tags                                  | Only in O2   | Only in O3   |
| ---- | ---------------------------------------- | ---------------------------------------- | ------------ | ------------ |
| 38   | HOISTED, MEMORY_READ                     | MEMORY_WRITE, HOISTED, MEMORY_READ       | -            | MEMORY_WRITE |
| 43   | HOISTED                                  | HOISTED, MEMORY_READ                     | -            | MEMORY_READ  |
| 46   | MEMORY_WRITE, HOISTED                    | HOISTED                                  | MEMORY_WRITE | -            |
| 50   | MEMORY_WRITE, HOISTED, MEMORY_READ, CALL | MEMORY_WRITE, MEMORY_READ, CALL          | HOISTED      | -            |
| 59   | MEMORY_WRITE, MEMORY_READ, CALL          | MEMORY_WRITE, HOISTED, MEMORY_READ, CALL | -            | HOISTED      |
| 63   | HOISTED, MEMORY_READ                     | MEMORY_READ                              | HOISTED      | -            |
| 64   | HOISTED                                  | MEMORY_READ                              | HOISTED      | MEMORY_READ  |


### src/polybench/POLYBENCH_2MM-Seq.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                            | O3 Tags                                        | Only in O2   | Only in O3               |
| ---- | ---------------------------------- | ---------------------------------------------- | ------------ | ------------------------ |
| 38   | VECTORIZED                         | HOISTED, VECTORIZED                            | -            | HOISTED                  |
| 39   | MEMORY_WRITE, HOISTED, MEMORY_READ | MEMORY_WRITE, HOISTED, MEMORY_READ, VECTORIZED | -            | VECTORIZED               |
| 40   | VECTORIZED, MEMORY_READ            | HOISTED, VECTORIZED, MEMORY_READ               | -            | HOISTED                  |
| 48   | VECTORIZED                         | HOISTED, VECTORIZED                            | -            | HOISTED                  |
| 50   | VECTORIZED, MEMORY_READ            | HOISTED, VECTORIZED, MEMORY_READ               | -            | HOISTED                  |
| 88   | MEMORY_WRITE, MEMORY_READ          | MEMORY_READ                                    | MEMORY_WRITE | -                        |
| 90   | MEMORY_READ                        | MEMORY_WRITE, MEMORY_READ, VECTORIZED          | -            | MEMORY_WRITE, VECTORIZED |
| 100  | MEMORY_READ                        | MEMORY_WRITE, MEMORY_READ                      | -            | MEMORY_WRITE             |
| 124  | VECTORIZED, MEMORY_READ            | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE  | -            | MEMORY_WRITE, INLINE     |
| 135  | VECTORIZED, MEMORY_READ            | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE  | -            | MEMORY_WRITE, INLINE     |


### src/polybench/POLYBENCH_ADI-Seq.cpp

**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags        |
| ---- | ----------- |
| 102  | MEMORY_READ |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                        | O3 Tags                                        | Only in O2   | Only in O3                            |
| ---- | ---------------------------------------------- | ---------------------------------------------- | ------------ | ------------------------------------- |
| 36   | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, MEMORY_READ             | VECTORIZED   | -                                     |
| 42   | HOISTED                                        | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -            | MEMORY_WRITE, VECTORIZED, MEMORY_READ |
| 43   | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -            | HOISTED                               |
| 47   | MEMORY_WRITE                                   | MEMORY_WRITE, MEMORY_READ                      | -            | MEMORY_READ                           |
| 96   | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | MEMORY_WRITE, MEMORY_READ                      | VECTORIZED   | -                                     |
| 107  | MEMORY_WRITE                                   | MEMORY_READ                                    | MEMORY_WRITE | MEMORY_READ                           |
| 130  | MEMORY_WRITE, CALL                             | MEMORY_WRITE, MEMORY_READ, CALL                | -            | MEMORY_READ                           |
| 140  | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE  | -            | INLINE                                |
| 171  | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | MEMORY_WRITE, MEMORY_READ                      | VECTORIZED   | -                                     |


### src/polybench/POLYBENCH_ATAX-Seq.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags       |
| ---- | ---------- |
| 85   | VECTORIZED |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags    |
| ---- | ------- |
| 38   | HOISTED |
| 46   | HOISTED |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                  | O3 Tags                                       | Only in O2 | Only in O3           |
| ---- | ------------------------ | --------------------------------------------- | ---------- | -------------------- |
| 37   | MEMORY_WRITE, VECTORIZED | MEMORY_WRITE, HOISTED, VECTORIZED             | -          | HOISTED              |
| 39   | VECTORIZED, MEMORY_READ  | HOISTED, VECTORIZED, MEMORY_READ              | -          | HOISTED              |
| 41   | MEMORY_WRITE, VECTORIZED | MEMORY_WRITE, HOISTED, VECTORIZED             | -          | HOISTED              |
| 45   | VECTORIZED, MEMORY_READ  | HOISTED, VECTORIZED, MEMORY_READ              | -          | HOISTED              |
| 49   | MEMORY_WRITE, VECTORIZED | MEMORY_WRITE, HOISTED, VECTORIZED             | -          | HOISTED              |
| 115  | VECTORIZED, MEMORY_READ  | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE | -          | MEMORY_WRITE, INLINE |
| 124  | VECTORIZED, MEMORY_READ  | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE | -          | MEMORY_WRITE, INLINE |


### src/polybench/POLYBENCH_MVT-Seq.cpp

**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                               |
| ---- | ---------------------------------- |
| 39   | MEMORY_WRITE, HOISTED, MEMORY_READ |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                     | O3 Tags                               | Only in O2              | Only in O3                |
| ---- | ------------------------------------------- | ------------------------------------- | ----------------------- | ------------------------- |
| 40   | VECTORIZED, MEMORY_READ                     | HOISTED, VECTORIZED, MEMORY_READ      | -                       | HOISTED                   |
| 42   | MEMORY_WRITE, VECTORIZED                    | MEMORY_WRITE, HOISTED, VECTORIZED     | -                       | HOISTED                   |
| 86   | VECTORIZED                                  | MEMORY_WRITE, MEMORY_READ             | VECTORIZED              | MEMORY_WRITE, MEMORY_READ |
| 112  | MEMORY_WRITE, VECTORIZED, CALL              | MEMORY_WRITE, CALL                    | VECTORIZED              | -                         |
| 116  | VECTORIZED, MEMORY_READ                     | VECTORIZED, MEMORY_READ, INLINE       | -                       | INLINE                    |
| 118  | MEMORY_WRITE, VECTORIZED, CALL              | MEMORY_WRITE, MEMORY_READ, CALL       | VECTORIZED              | MEMORY_READ               |
| 119  | MEMORY_WRITE, VECTORIZED                    | MEMORY_WRITE, VECTORIZED, MEMORY_READ | -                       | MEMORY_READ               |
| 121  | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL | MEMORY_WRITE, CALL                    | VECTORIZED, MEMORY_READ | -                         |
| 122  | VECTORIZED, MEMORY_READ                     | VECTORIZED                            | MEMORY_READ             | -                         |


### src/apps/PRESSURE-Seq.cpp

**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                     |
| ---- | ------------------------ |
| 39   | MEMORY_WRITE, VECTORIZED |
| 51   | HOISTED, MEMORY_READ     |
| 72   | MEMORY_READ              |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                        | Only in O2 | Only in O3   |
| ---- | ------------------------------------- | ---------------------------------------------- | ---------- | ------------ |
| 31   | VECTORIZED, MEMORY_READ               | MEMORY_WRITE, MEMORY_READ, VECTORIZED          | -          | MEMORY_WRITE |
| 32   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL    | -          | CALL         |
| 34   | VECTORIZED, MEMORY_READ               | MEMORY_WRITE, MEMORY_READ, VECTORIZED          | -          | MEMORY_WRITE |
| 35   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL    | -          | CALL         |
| 48   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -          | HOISTED      |
| 52   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -          | HOISTED      |


### src/lcals/EOS-Seq.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                        | Only in O2         | Only in O3  |
| ---- | ------------------------------------- | ---------------------------------------------- | ------------------ | ----------- |
| 32   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL    | -                  | CALL        |
| 38   | MEMORY_WRITE, VECTORIZED              | MEMORY_WRITE, CALL                             | VECTORIZED         | CALL        |
| 40   | MEMORY_WRITE, VECTORIZED, INLINE      | MEMORY_WRITE, INLINE, CALL                     | VECTORIZED         | CALL        |
| 42   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, MEMORY_READ                      | VECTORIZED         | -           |
| 44   | HOISTED, MEMORY_READ                  | HOISTED, VECTORIZED, MEMORY_READ               | -                  | VECTORIZED  |
| 45   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -                  | HOISTED     |
| 59   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, MEMORY_READ                      | VECTORIZED         | -           |
| 61   | MEMORY_READ                           | VECTORIZED, MEMORY_READ                        | -                  | VECTORIZED  |
| 79   | MEMORY_WRITE, INLINE, CALL            | MEMORY_READ, INLINE                            | MEMORY_WRITE, CALL | MEMORY_READ |


### src/polybench/POLYBENCH_GEMM-Seq.cpp

**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                       |
| ---- | -------------------------- |
| 41   | HOISTED                    |
| 49   | MEMORY_WRITE, INLINE, CALL |
| 85   | MEMORY_WRITE, INLINE, CALL |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                        | Only in O2 | Only in O3 |
| ---- | ------------------------------------- | ---------------------------------------------- | ---------- | ---------- |
| 35   | MEMORY_WRITE, MEMORY_READ             | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -          | VECTORIZED |
| 39   | VECTORIZED, MEMORY_READ               | HOISTED, VECTORIZED, MEMORY_READ               | -          | HOISTED    |
| 40   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -          | HOISTED    |
| 42   | VECTORIZED, MEMORY_READ               | HOISTED, VECTORIZED, MEMORY_READ               | -          | HOISTED    |
| 44   | MEMORY_WRITE, VECTORIZED              | MEMORY_WRITE, HOISTED, VECTORIZED              | -          | HOISTED    |
| 104  | VECTORIZED, MEMORY_READ               | VECTORIZED, MEMORY_READ, INLINE                | -          | INLINE     |


### src/polybench/POLYBENCH_JACOBI_1D-Seq.cpp

**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                             |
| ---- | -------------------------------- |
| 49   | HOISTED, VECTORIZED, MEMORY_READ |
| 70   | MEMORY_READ                      |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                        | O3 Tags                                              | Only in O2 | Only in O3   |
| ---- | ---------------------------------------------- | ---------------------------------------------------- | ---------- | ------------ |
| 27   | MEMORY_READ                                    | MEMORY_WRITE, MEMORY_READ                            | -          | MEMORY_WRITE |
| 31   | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | MEMORY_READ, MEMORY_WRITE, HOISTED, VECTORIZED, CALL | -          | CALL         |
| 34   | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | MEMORY_READ, MEMORY_WRITE, HOISTED, VECTORIZED, CALL | -          | CALL         |
| 44   | MEMORY_WRITE, MEMORY_READ                      | MEMORY_WRITE, VECTORIZED, MEMORY_READ                | -          | VECTORIZED   |
| 47   | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | MEMORY_WRITE, HOISTED, MEMORY_READ, VECTORIZED       | -          | HOISTED      |
| 50   | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ       | -          | HOISTED      |
| 89   | INLINE                                         | MEMORY_READ, INLINE                                  | -          | MEMORY_READ  |


### src/polybench/POLYBENCH_JACOBI_2D-Seq.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags                       |
| ---- | -------------------------- |
| 82   | MEMORY_WRITE, INLINE, CALL |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                      |
| ---- | ------------------------- |
| 42   | MEMORY_WRITE, MEMORY_READ |
| 43   | MEMORY_WRITE, MEMORY_READ |
| 70   | MEMORY_WRITE, MEMORY_READ |
| 75   | MEMORY_WRITE, MEMORY_READ |
| 76   | MEMORY_WRITE, MEMORY_READ |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                       | Only in O2   | Only in O3                |
| ---- | ------------------------------------- | --------------------------------------------- | ------------ | ------------------------- |
| 38   | HOISTED                               | MEMORY_WRITE, HOISTED, MEMORY_READ            | -            | MEMORY_WRITE, MEMORY_READ |
| 94   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE | -            | INLINE                    |
| 118  | MEMORY_WRITE, INLINE                  | MEMORY_READ, INLINE                           | MEMORY_WRITE | MEMORY_READ               |


### tpl/RAJA/include/RAJA/util/PermutedLayout.hpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags                                          |
| ---- | --------------------------------------------- |
| 89   | MEMORY_WRITE, MEMORY_READ, VECTORIZED, INLINE |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                  | O3 Tags                                              | Only in O2   | Only in O3  |
| ---- | ---------------------------------------- | ---------------------------------------------------- | ------------ | ----------- |
| 66   | MEMORY_WRITE, CALL                       | MEMORY_WRITE, MEMORY_READ, CALL                      | -            | MEMORY_READ |
| 72   | MEMORY_WRITE, MEMORY_READ, CALL          | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL          | -            | VECTORIZED  |
| 75   | MEMORY_WRITE, HOISTED, MEMORY_READ       | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ       | -            | VECTORIZED  |
| 76   | MEMORY_WRITE, HOISTED, MEMORY_READ, CALL | MEMORY_READ, MEMORY_WRITE, HOISTED, VECTORIZED, CALL | -            | VECTORIZED  |
| 82   | MEMORY_WRITE, MEMORY_READ, CALL          | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL          | -            | VECTORIZED  |
| 92   | MEMORY_WRITE, HOISTED, MEMORY_READ       | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ       | -            | VECTORIZED  |
| 93   | MEMORY_WRITE, HOISTED, MEMORY_READ       | HOISTED, VECTORIZED, MEMORY_READ                     | MEMORY_WRITE | VECTORIZED  |
| 94   | MEMORY_WRITE, HOISTED, MEMORY_READ       | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ       | -            | VECTORIZED  |


### src/algorithm/MEMSET-Seq.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                     | Only in O2   | Only in O3   |
| ---- | ------------------------------------- | ------------------------------------------- | ------------ | ------------ |
| 75   | MEMORY_READ, INLINE                   | MEMORY_WRITE, INLINE                        | MEMORY_READ  | MEMORY_WRITE |
| 76   | MEMORY_READ                           | VECTORIZED, MEMORY_READ                     | -            | VECTORIZED   |
| 77   | MEMORY_READ, INLINE                   | VECTORIZED, MEMORY_READ, INLINE             | -            | VECTORIZED   |
| 89   | MEMORY_WRITE, HOISTED, VECTORIZED     | HOISTED, VECTORIZED, MEMORY_READ            | MEMORY_WRITE | MEMORY_READ  |
| 110  | MEMORY_WRITE, VECTORIZED, MEMORY_READ | VECTORIZED, MEMORY_READ                     | MEMORY_WRITE | -            |
| 131  | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, MEMORY_READ, VECTORIZED, CALL | -            | CALL         |
| 157  | INLINE                                | MEMORY_WRITE, INLINE                        | -            | MEMORY_WRITE |
| 162  | INLINE                                | MEMORY_WRITE, INLINE                        | -            | MEMORY_WRITE |


### src/common/KernelBase.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags        |
| ---- | ----------- |
| 353  | MEMORY_READ |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                       | O3 Tags                         | Only in O2         | Only in O3  |
| ---- | --------------------------------------------- | ------------------------------- | ------------------ | ----------- |
| 170  | MEMORY_WRITE, INLINE                          | INLINE                          | MEMORY_WRITE       | -           |
| 172  | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE | MEMORY_WRITE, MEMORY_READ, CALL | VECTORIZED, INLINE | CALL        |
| 173  | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE | MEMORY_WRITE, MEMORY_READ, CALL | VECTORIZED, INLINE | CALL        |
| 174  | MEMORY_WRITE, INLINE                          | MEMORY_WRITE, CALL              | INLINE             | CALL        |
| 317  | MEMORY_WRITE, MEMORY_READ                     | MEMORY_WRITE                    | MEMORY_READ        | -           |
| 329  | INLINE                                        | MEMORY_READ, INLINE             | -                  | MEMORY_READ |
| 356  | VECTORIZED, MEMORY_READ, INLINE               | MEMORY_READ, INLINE             | VECTORIZED         | -           |


### src/polybench/POLYBENCH_FLOYD_WARSHALL-Seq.cpp

**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                                  |
| ---- | ------------------------------------- |
| 64   | MEMORY_WRITE, MEMORY_READ             |
| 65   | MEMORY_WRITE, VECTORIZED, MEMORY_READ |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                        | Only in O2 | Only in O3                            |
| ---- | ------------------------------------- | ---------------------------------------------- | ---------- | ------------------------------------- |
| 36   | HOISTED, MEMORY_READ                  | MEMORY_WRITE, HOISTED, MEMORY_READ             | -          | MEMORY_WRITE                          |
| 37   | HOISTED                               | MEMORY_WRITE, HOISTED, MEMORY_READ             | -          | MEMORY_WRITE, MEMORY_READ             |
| 38   | HOISTED                               | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -          | MEMORY_WRITE, VECTORIZED, MEMORY_READ |
| 39   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -          | HOISTED                               |
| 63   | MEMORY_READ                           | MEMORY_WRITE, MEMORY_READ                      | -          | MEMORY_WRITE                          |
| 85   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE  | -          | INLINE                                |


### src/algorithm/REDUCE_SUM-Seq.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                       | O3 Tags                                             | Only in O2   | Only in O3   |
| ---- | --------------------------------------------- | --------------------------------------------------- | ------------ | ------------ |
| 62   | HOISTED, MEMORY_READ                          | HOISTED                                             | MEMORY_READ  | -            |
| 107  | VECTORIZED, MEMORY_READ                       | VECTORIZED, MEMORY_READ, INLINE                     | -            | INLINE       |
| 126  | MEMORY_WRITE, MEMORY_READ, INLINE             | MEMORY_WRITE, MEMORY_READ                           | INLINE       | -            |
| 128  | VECTORIZED, MEMORY_READ, INLINE               | MEMORY_WRITE, VECTORIZED, MEMORY_READ               | INLINE       | MEMORY_WRITE |
| 132  | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE | MEMORY_READ, MEMORY_WRITE, INLINE, VECTORIZED, CALL | -            | CALL         |
| 136  | MEMORY_WRITE, VECTORIZED, INLINE              | MEMORY_WRITE, VECTORIZED, MEMORY_READ               | INLINE       | MEMORY_READ  |
| 152  | MEMORY_WRITE, MEMORY_READ, VECTORIZED         | VECTORIZED, MEMORY_READ                             | MEMORY_WRITE | -            |


### src/basic/DAXPY-Seq.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                        | Only in O2 | Only in O3 |
| ---- | ------------------------------------- | ---------------------------------------------- | ---------- | ---------- |
| 25   | MEMORY_READ                           | VECTORIZED, MEMORY_READ                        | -          | VECTORIZED |
| 26   | MEMORY_READ, INLINE                   | VECTORIZED, MEMORY_READ, INLINE                | -          | VECTORIZED |
| 32   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL    | -          | CALL       |
| 42   | MEMORY_WRITE, MEMORY_READ             | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -          | VECTORIZED |
| 44   | HOISTED, MEMORY_READ                  | HOISTED, VECTORIZED, MEMORY_READ               | -          | VECTORIZED |
| 45   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -          | HOISTED    |
| 61   | MEMORY_READ                           | VECTORIZED, MEMORY_READ                        | -          | VECTORIZED |


### src/basic/DAXPY_ATOMIC-Seq.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                             | Only in O2 | Only in O3         |
| ---- | ------------------------------------- | --------------------------------------------------- | ---------- | ------------------ |
| 25   | MEMORY_READ                           | VECTORIZED, MEMORY_READ                             | -          | VECTORIZED         |
| 26   | MEMORY_READ, INLINE                   | VECTORIZED, MEMORY_READ, INLINE                     | -          | VECTORIZED         |
| 36   | MEMORY_WRITE, MEMORY_READ             | MEMORY_WRITE, VECTORIZED, MEMORY_READ               | -          | VECTORIZED         |
| 38   | HOISTED, MEMORY_READ                  | HOISTED, VECTORIZED, MEMORY_READ                    | -          | VECTORIZED         |
| 39   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ      | -          | HOISTED            |
| 59   | MEMORY_READ                           | VECTORIZED, MEMORY_READ                             | -          | VECTORIZED         |
| 80   | VECTORIZED, MEMORY_READ, INLINE       | MEMORY_READ, MEMORY_WRITE, INLINE, VECTORIZED, CALL | -          | MEMORY_WRITE, CALL |


### tpl/RAJA/include/RAJA/pattern/params/forall.hpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags                    |
| ---- | ----------------------- |
| 153  | VECTORIZED, MEMORY_READ |
| 269  | VECTORIZED, MEMORY_READ |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                 | Only in O2   | Only in O3 |
| ---- | ------------------------------------- | ----------------------- | ------------ | ---------- |
| 228  | MEMORY_WRITE, MEMORY_READ, VECTORIZED | MEMORY_READ, VECTORIZED | MEMORY_WRITE | -          |
| 244  | MEMORY_WRITE, MEMORY_READ, VECTORIZED | MEMORY_READ, VECTORIZED | MEMORY_WRITE | -          |
| 578  | MEMORY_WRITE, MEMORY_READ, VECTORIZED | MEMORY_READ, VECTORIZED | MEMORY_WRITE | -          |
| 586  | MEMORY_WRITE, MEMORY_READ, VECTORIZED | MEMORY_READ, VECTORIZED | MEMORY_WRITE | -          |
| 598  | MEMORY_WRITE, MEMORY_READ, VECTORIZED | MEMORY_READ, VECTORIZED | MEMORY_WRITE | -          |


### tpl/RAJA/include/RAJA/util/TypedViewBase.hpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags                    |
| ---- | ----------------------- |
| 773  | VECTORIZED, MEMORY_READ |
| 775  | INLINE                  |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                 | O3 Tags                               | Only in O2 | Only in O3                |
| ---- | ----------------------- | ------------------------------------- | ---------- | ------------------------- |
| 213  | VECTORIZED, MEMORY_READ | MEMORY_WRITE, VECTORIZED, MEMORY_READ | -          | MEMORY_WRITE              |
| 218  | INLINE                  | MEMORY_WRITE, MEMORY_READ, INLINE     | -          | MEMORY_WRITE, MEMORY_READ |
| 451  | VECTORIZED, MEMORY_READ | MEMORY_WRITE, VECTORIZED, MEMORY_READ | -          | MEMORY_WRITE              |
| 680  | VECTORIZED, MEMORY_READ | MEMORY_WRITE, VECTORIZED, MEMORY_READ | -          | MEMORY_WRITE              |
| 765  | MEMORY_WRITE            | MEMORY_WRITE, MEMORY_READ             | -          | MEMORY_READ               |


### src/./common/RunParams.hpp

**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags         |
| ---- | ------------ |
| 65   | MEMORY_WRITE |
| 67   | MEMORY_WRITE |
| 70   | MEMORY_WRITE |
| 72   | MEMORY_WRITE |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags            | O3 Tags                    | Only in O2 | Only in O3 |
| ---- | ------------------ | -------------------------- | ---------- | ---------- |
| 71   | MEMORY_WRITE, CALL | MEMORY_WRITE, INLINE, CALL | -          | INLINE     |
| 73   | MEMORY_WRITE, CALL | MEMORY_WRITE, INLINE, CALL | -          | INLINE     |


### src/algorithm/HISTOGRAM-Seq.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                 | O3 Tags                                        | Only in O2  | Only in O3         |
| ---- | --------------------------------------- | ---------------------------------------------- | ----------- | ------------------ |
| 40   | MEMORY_WRITE, HOISTED, MEMORY_READ      | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -           | VECTORIZED         |
| 46   | MEMORY_WRITE, HOISTED, MEMORY_READ      | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -           | VECTORIZED         |
| 57   | MEMORY_READ                             | MEMORY_WRITE, CALL                             | MEMORY_READ | MEMORY_WRITE, CALL |
| 59   | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | MEMORY_WRITE, INLINE, CALL                     | MEMORY_READ | -                  |
| 69   | MEMORY_WRITE, MEMORY_READ               | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -           | VECTORIZED         |
| 75   | MEMORY_WRITE, MEMORY_READ               | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -           | VECTORIZED         |


### src/lcals/INT_PREDICT-Seq.cpp

**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                       |
| ---- | -------------------------- |
| 66   | MEMORY_WRITE, INLINE, CALL |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                        | Only in O2 | Only in O3   |
| ---- | ------------------------------------- | ---------------------------------------------- | ---------- | ------------ |
| 32   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, MEMORY_READ, VECTORIZED, CALL    | -          | CALL         |
| 44   | HOISTED, VECTORIZED, MEMORY_READ      | MEMORY_WRITE, HOISTED, MEMORY_READ             | VECTORIZED | MEMORY_WRITE |
| 45   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -          | HOISTED      |
| 59   | MEMORY_WRITE, MEMORY_READ             | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | -          | VECTORIZED   |
| 61   | VECTORIZED, MEMORY_READ               | MEMORY_READ                                    | VECTORIZED | -            |


### src/stream/DOT-Seq.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                       | O3 Tags                                             | Only in O2               | Only in O3   |
| ---- | --------------------------------------------- | --------------------------------------------------- | ------------------------ | ------------ |
| 31   | MEMORY_WRITE, VECTORIZED, MEMORY_READ         | MEMORY_READ                                         | MEMORY_WRITE, VECTORIZED | -            |
| 45   | MEMORY_READ                                   | MEMORY_READ, VECTORIZED                             | -                        | VECTORIZED   |
| 126  | MEMORY_WRITE, MEMORY_READ, INLINE             | MEMORY_WRITE, MEMORY_READ                           | INLINE                   | -            |
| 128  | VECTORIZED, MEMORY_READ, INLINE               | MEMORY_WRITE, VECTORIZED, MEMORY_READ               | INLINE                   | MEMORY_WRITE |
| 131  | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE | MEMORY_READ, MEMORY_WRITE, INLINE, VECTORIZED, CALL | -                        | CALL         |
| 135  | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE | MEMORY_WRITE, VECTORIZED, MEMORY_READ               | INLINE                   | -            |


### src/stream/MUL-Seq.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                        | Only in O2 | Only in O3 |
| ---- | ------------------------------------- | ---------------------------------------------- | ---------- | ---------- |
| 25   | MEMORY_READ                           | VECTORIZED, MEMORY_READ                        | -          | VECTORIZED |
| 26   | MEMORY_READ, INLINE                   | VECTORIZED, MEMORY_READ, INLINE                | -          | VECTORIZED |
| 32   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL    | -          | CALL       |
| 44   | HOISTED, MEMORY_READ                  | HOISTED, VECTORIZED, MEMORY_READ               | -          | VECTORIZED |
| 45   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -          | HOISTED    |
| 61   | MEMORY_READ                           | VECTORIZED, MEMORY_READ                        | -          | VECTORIZED |


### tpl/RAJA/include/RAJA/policy/sequential/launch.hpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags        |
| ---- | ----------- |
| 48   | MEMORY_READ |
| 62   | INLINE      |
| 64   | MEMORY_READ |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                         | O3 Tags            | Only in O2         | Only in O3 |
| ---- | ------------------------------- | ------------------ | ------------------ | ---------- |
| 63   | MEMORY_WRITE, MEMORY_READ, CALL | MEMORY_WRITE, CALL | MEMORY_READ        | -          |
| 72   | MEMORY_WRITE, INLINE, CALL      | INLINE             | MEMORY_WRITE, CALL | -          |
| 75   | MEMORY_WRITE, MEMORY_READ, CALL | MEMORY_WRITE, CALL | MEMORY_READ        | -          |


### src/apps/INTSC_HEXRECT-Seq.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags   |
| ---- | ------ |
| 84   | INLINE |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags         |
| ---- | ------------ |
| 40   | MEMORY_WRITE |
| 53   | INLINE       |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                             | O3 Tags                                       | Only in O2  | Only in O3   |
| ---- | --------------------------------------------------- | --------------------------------------------- | ----------- | ------------ |
| 36   | MEMORY_READ, MEMORY_WRITE, INLINE, VECTORIZED, CALL | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE | CALL        | -            |
| 83   | MEMORY_READ, INLINE                                 | MEMORY_WRITE, INLINE                          | MEMORY_READ | MEMORY_WRITE |


### src/basic/INDEXLIST_3LOOP-Seq.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags        |
| ---- | ----------- |
| 66   | MEMORY_READ |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                    |
| ---- | ----------------------- |
| 120  | VECTORIZED, MEMORY_READ |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                 | O3 Tags                                     | Only in O2  | Only in O3              |
| ---- | --------------------------------------- | ------------------------------------------- | ----------- | ----------------------- |
| 68   | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | MEMORY_WRITE, INLINE, CALL                  | MEMORY_READ | -                       |
| 70   | MEMORY_WRITE, CALL                      | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL | -           | VECTORIZED, MEMORY_READ |
| 83   | INLINE                                  | VECTORIZED, MEMORY_READ, INLINE             | -           | VECTORIZED, MEMORY_READ |


### src/basic/TRAP_INT-Seq.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                       | O3 Tags                                             | Only in O2         | Only in O3   |
| ---- | --------------------------------------------- | --------------------------------------------------- | ------------------ | ------------ |
| 91   | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE | MEMORY_WRITE, MEMORY_READ                           | VECTORIZED, INLINE | -            |
| 93   | VECTORIZED, MEMORY_READ, INLINE               | MEMORY_WRITE, VECTORIZED, MEMORY_READ               | INLINE             | MEMORY_WRITE |
| 96   | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE | MEMORY_READ, MEMORY_WRITE, INLINE, VECTORIZED, CALL | -                  | CALL         |
| 97   | VECTORIZED, INLINE                            | MEMORY_READ, VECTORIZED, INLINE                     | -                  | MEMORY_READ  |
| 100  | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE | MEMORY_WRITE, VECTORIZED, MEMORY_READ               | INLINE             | -            |


### src/common/OutputUtils.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags        |
| ---- | ----------- |
| 67   | MEMORY_READ |
| 68   | MEMORY_READ |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags             | O3 Tags             | Only in O2          | Only in O3         |
| ---- | ------------------- | ------------------- | ------------------- | ------------------ |
| 42   | MEMORY_READ, INLINE | MEMORY_WRITE, CALL  | MEMORY_READ, INLINE | MEMORY_WRITE, CALL |
| 43   | MEMORY_READ         | MEMORY_READ, INLINE | -                   | INLINE             |
| 122  | MEMORY_READ         | MEMORY_READ, INLINE | -                   | INLINE             |


### tpl/RAJA/include/RAJA/internal/Iterators.hpp

**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                      |
| ---- | ------------------------- |
| 243  | MEMORY_WRITE, MEMORY_READ |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                   | O3 Tags                               | Only in O2 | Only in O3   |
| ---- | ------------------------- | ------------------------------------- | ---------- | ------------ |
| 234  | MEMORY_WRITE, MEMORY_READ | MEMORY_WRITE, VECTORIZED, MEMORY_READ | -          | VECTORIZED   |
| 281  | VECTORIZED, MEMORY_READ   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | -          | MEMORY_WRITE |
| 293  | MEMORY_WRITE, MEMORY_READ | MEMORY_WRITE, VECTORIZED, MEMORY_READ | -          | VECTORIZED   |
| 380  | MEMORY_WRITE              | MEMORY_WRITE, MEMORY_READ             | -          | MEMORY_READ  |


### src/algorithm/MEMCPY-Seq.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                        | Only in O2 | Only in O3   |
| ---- | ------------------------------------- | ---------------------------------------------- | ---------- | ------------ |
| 89   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -          | HOISTED      |
| 130  | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL    | -          | CALL         |
| 154  | INLINE                                | MEMORY_WRITE, INLINE                           | -          | MEMORY_WRITE |
| 158  | INLINE                                | MEMORY_WRITE, INLINE                           | -          | MEMORY_WRITE |


### src/algorithm/SORTPAIRS-Seq.cpp

**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                 |
| ---- | -------------------- |
| 46   | HOISTED, MEMORY_READ |
| 55   | HOISTED, MEMORY_READ |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                    | O3 Tags                      | Only in O2         | Only in O3           |
| ---- | -------------------------- | ---------------------------- | ------------------ | -------------------- |
| 50   | INLINE                     | HOISTED, MEMORY_READ, INLINE | -                  | HOISTED, MEMORY_READ |
| 71   | MEMORY_WRITE, INLINE, CALL | INLINE                       | MEMORY_WRITE, CALL | -                    |


### src/basic/INIT3-Seq.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                        | Only in O2 | Only in O3 |
| ---- | ------------------------------------- | ---------------------------------------------- | ---------- | ---------- |
| 32   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL    | -          | CALL       |
| 44   | HOISTED, MEMORY_READ                  | HOISTED, VECTORIZED, MEMORY_READ               | -          | VECTORIZED |
| 45   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -          | HOISTED    |
| 61   | MEMORY_READ                           | VECTORIZED, MEMORY_READ                        | -          | VECTORIZED |


### src/basic/NESTED_INIT-Seq.cpp

**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                       |
| ---- | -------------------------- |
| 64   | VECTORIZED                 |
| 72   | MEMORY_WRITE, INLINE, CALL |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags             | O3 Tags             | Only in O2 | Only in O3 |
| ---- | ------------------- | ------------------- | ---------- | ---------- |
| 43   | HOISTED             | HOISTED, VECTORIZED | -          | VECTORIZED |
| 44   | HOISTED, VECTORIZED | VECTORIZED          | HOISTED    | -          |


### src/basic/PI_REDUCE-Seq.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                       | O3 Tags                                             | Only in O2 | Only in O3   |
| ---- | --------------------------------------------- | --------------------------------------------------- | ---------- | ------------ |
| 126  | MEMORY_WRITE, MEMORY_READ, INLINE             | MEMORY_WRITE, MEMORY_READ                           | INLINE     | -            |
| 128  | VECTORIZED, MEMORY_READ, INLINE               | MEMORY_WRITE, VECTORIZED, MEMORY_READ               | INLINE     | MEMORY_WRITE |
| 132  | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE | MEMORY_READ, MEMORY_WRITE, INLINE, VECTORIZED, CALL | -          | CALL         |
| 136  | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE | MEMORY_WRITE, VECTORIZED, MEMORY_READ               | INLINE     | -            |


### src/comm/HALO_PACKING.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags   |
| ---- | ------ |
| 86   | INLINE |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags             | O3 Tags                      | Only in O2 | Only in O3 |
| ---- | ------------------- | ---------------------------- | ---------- | ---------- |
| 98   | MEMORY_READ         | HOISTED, MEMORY_READ         | -          | HOISTED    |
| 99   | MEMORY_READ         | HOISTED, MEMORY_READ         | -          | HOISTED    |
| 100  | MEMORY_READ, INLINE | HOISTED, MEMORY_READ, INLINE | -          | HOISTED    |


### src/comm/HALO_PACKING_FUSED.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags   |
| ---- | ------ |
| 86   | INLINE |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags             | O3 Tags                      | Only in O2 | Only in O3 |
| ---- | ------------------- | ---------------------------- | ---------- | ---------- |
| 98   | MEMORY_READ         | HOISTED, MEMORY_READ         | -          | HOISTED    |
| 99   | MEMORY_READ         | HOISTED, MEMORY_READ         | -          | HOISTED    |
| 100  | MEMORY_READ, INLINE | HOISTED, MEMORY_READ, INLINE | -          | HOISTED    |


### src/lcals/FIRST_MIN-Seq.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                       | O3 Tags                                       | Only in O2   | Only in O3   |
| ---- | --------------------------------------------- | --------------------------------------------- | ------------ | ------------ |
| 91   | MEMORY_WRITE, MEMORY_READ, INLINE             | MEMORY_WRITE, MEMORY_READ                     | INLINE       | -            |
| 94   | VECTORIZED, MEMORY_READ, INLINE               | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE | -            | MEMORY_WRITE |
| 95   | MEMORY_READ                                   | MEMORY_WRITE, MEMORY_READ                     | -            | MEMORY_WRITE |
| 98   | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE | VECTORIZED, MEMORY_READ, INLINE               | MEMORY_WRITE | -            |


### src/stream/TRIAD-Seq.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                        | Only in O2 | Only in O3 |
| ---- | ------------------------------------- | ---------------------------------------------- | ---------- | ---------- |
| 32   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL    | -          | CALL       |
| 44   | HOISTED, MEMORY_READ                  | HOISTED, VECTORIZED, MEMORY_READ               | -          | VECTORIZED |
| 45   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -          | HOISTED    |
| 61   | MEMORY_READ                           | VECTORIZED, MEMORY_READ                        | -          | VECTORIZED |


### tpl/RAJA/include/RAJA/pattern/WorkGroup.hpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                 | O3 Tags                    | Only in O2                      | Only in O3 |
| ---- | --------------------------------------- | -------------------------- | ------------------------------- | ---------- |
| 257  | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | MEMORY_WRITE, INLINE, CALL | MEMORY_READ                     | -          |
| 389  | MEMORY_WRITE, MEMORY_READ               | MEMORY_WRITE               | MEMORY_READ                     | -          |
| 505  | MEMORY_WRITE, CALL                      | MEMORY_WRITE               | CALL                            | -          |
| 527  | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | INLINE                     | MEMORY_WRITE, MEMORY_READ, CALL | -          |


### tpl/RAJA/include/RAJA/pattern/WorkGroup/WorkStorage.hpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags        |
| ---- | ----------- |
| 877  | MEMORY_READ |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                  | Only in O2   | Only in O3 |
| ---- | ------------------------------------- | ------------------------ | ------------ | ---------- |
| 840  | MEMORY_WRITE, MEMORY_READ             | MEMORY_WRITE             | MEMORY_READ  | -          |
| 880  | MEMORY_WRITE, MEMORY_READ             | MEMORY_READ              | MEMORY_WRITE | -          |
| 902  | MEMORY_WRITE, MEMORY_READ, VECTORIZED | MEMORY_WRITE, VECTORIZED | MEMORY_READ  | -          |


### tpl/RAJA/include/RAJA/policy/sequential/multi_reduce.hpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                 | O3 Tags                   | Only in O2                 | Only in O3   |
| ---- | --------------------------------------- | ------------------------- | -------------------------- | ------------ |
| 81   | MEMORY_WRITE, MEMORY_READ, INLINE       | MEMORY_WRITE, MEMORY_READ | INLINE                     | -            |
| 99   | MEMORY_READ, INLINE                     | MEMORY_READ               | INLINE                     | -            |
| 164  | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | MEMORY_READ               | MEMORY_WRITE, INLINE, CALL | -            |
| 166  | MEMORY_READ                             | MEMORY_WRITE, MEMORY_READ | -                          | MEMORY_WRITE |


### src/apps/FEMSWEEP-Seq.cpp

**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags        |
| ---- | ----------- |
| 63   | MEMORY_READ |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                              | O3 Tags                                             | Only in O2 | Only in O3 |
| ---- | ---------------------------------------------------- | --------------------------------------------------- | ---------- | ---------- |
| 38   | MEMORY_READ, MEMORY_WRITE, HOISTED, VECTORIZED, CALL | MEMORY_READ, MEMORY_WRITE, INLINE, VECTORIZED, CALL | HOISTED    | INLINE     |
| 66   | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL          | MEMORY_READ, MEMORY_WRITE, INLINE, VECTORIZED, CALL | -          | INLINE     |


### src/apps/INTSC_HEXHEX-Seq.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                   | O3 Tags                               | Only in O2   | Only in O3               |
| ---- | ------------------------- | ------------------------------------- | ------------ | ------------------------ |
| 31   | MEMORY_WRITE, MEMORY_READ | MEMORY_READ                           | MEMORY_WRITE | -                        |
| 33   | MEMORY_READ               | MEMORY_WRITE, MEMORY_READ             | -            | MEMORY_WRITE             |
| 54   | MEMORY_READ               | MEMORY_WRITE, VECTORIZED, MEMORY_READ | -            | MEMORY_WRITE, VECTORIZED |


### src/basic/MULADDSUB-Seq.cpp

**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                       |
| ---- | -------------------------- |
| 66   | MEMORY_WRITE, INLINE, CALL |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                        | O3 Tags                                              | Only in O2 | Only in O3 |
| ---- | ---------------------------------------------- | ---------------------------------------------------- | ---------- | ---------- |
| 32   | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | MEMORY_READ, MEMORY_WRITE, HOISTED, VECTORIZED, CALL | -          | CALL       |
| 45   | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ       | -          | HOISTED    |


### src/basic/REDUCE_STRUCT.cpp

**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags                                  |
| ---- | ------------------------------------- |
| 81   | MEMORY_WRITE, MEMORY_READ, VECTORIZED |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                   | O3 Tags                                 | Only in O2 | Only in O3         |
| ---- | ------------------------- | --------------------------------------- | ---------- | ------------------ |
| 74   | MEMORY_WRITE, MEMORY_READ | MEMORY_WRITE, MEMORY_READ, CALL         | -          | CALL               |
| 76   | MEMORY_READ, INLINE       | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | -          | MEMORY_WRITE, CALL |


### src/lcals/HYDRO_1D-Seq.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                        | O3 Tags                                              | Only in O2 | Only in O3 |
| ---- | ---------------------------------------------- | ---------------------------------------------------- | ---------- | ---------- |
| 32   | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | MEMORY_READ, MEMORY_WRITE, HOISTED, VECTORIZED, CALL | -          | CALL       |
| 42   | MEMORY_WRITE, MEMORY_READ                      | MEMORY_WRITE, VECTORIZED, MEMORY_READ                | -          | VECTORIZED |
| 45   | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ       | -          | HOISTED    |


### src/lcals/TRIDIAG_ELIM-Seq.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                        | O3 Tags                                              | Only in O2 | Only in O3   |
| ---- | ---------------------------------------------- | ---------------------------------------------------- | ---------- | ------------ |
| 26   | MEMORY_READ                                    | MEMORY_WRITE, MEMORY_READ                            | -          | MEMORY_WRITE |
| 32   | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | MEMORY_READ, MEMORY_WRITE, HOISTED, VECTORIZED, CALL | -          | CALL         |
| 45   | MEMORY_WRITE, VECTORIZED, MEMORY_READ          | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ       | -          | HOISTED      |


### tpl/RAJA/include/RAJA/pattern/WorkGroup/WorkRunner.hpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags         |
| ---- | ------------ |
| 264  | MEMORY_WRITE |
| 272  | INLINE       |
| 279  | MEMORY_READ  |


### tpl/RAJA/include/RAJA/pattern/launch/launch_core.hpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags         |
| ---- | ------------ |
| 195  | MEMORY_READ  |
| 196  | MEMORY_WRITE |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                         | O3 Tags                          | Only in O2  | Only in O3   |
| ---- | ------------------------------- | -------------------------------- | ----------- | ------------ |
| 160  | VECTORIZED, MEMORY_READ, INLINE | MEMORY_WRITE, VECTORIZED, INLINE | MEMORY_READ | MEMORY_WRITE |


### tpl/RAJA/include/RAJA/pattern/params/params_base.hpp

**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags       |
| ---- | ---------- |
| 85   | VECTORIZED |
| 98   | VECTORIZED |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                 | Only in O2   | Only in O3 |
| ---- | ------------------------------------- | ----------------------- | ------------ | ---------- |
| 109  | MEMORY_WRITE, MEMORY_READ, VECTORIZED | MEMORY_READ, VECTORIZED | MEMORY_WRITE | -          |


### tpl/RAJA/include/RAJA/util/zip.hpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags        |
| ---- | ----------- |
| 172  | MEMORY_READ |


**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags   |
| ---- | ------ |
| 80   | INLINE |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags     | O3 Tags                   | Only in O2 | Only in O3   |
| ---- | ----------- | ------------------------- | ---------- | ------------ |
| 175  | MEMORY_READ | MEMORY_WRITE, MEMORY_READ | -          | MEMORY_WRITE |


### src/algorithm/SCAN-Seq.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                  | Only in O2  | Only in O3 |
| ---- | ------------------------------------- | ------------------------ | ----------- | ---------- |
| 55   | MEMORY_READ, VECTORIZED               | VECTORIZED               | MEMORY_READ | -          |
| 56   | MEMORY_WRITE, MEMORY_READ, VECTORIZED | MEMORY_WRITE, VECTORIZED | MEMORY_READ | -          |


### src/apps/FIR-Seq.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                            | O3 Tags                                        | Only in O2               | Only in O3  |
| ---- | ---------------------------------- | ---------------------------------------------- | ------------------------ | ----------- |
| 29   | MEMORY_WRITE, VECTORIZED           | MEMORY_READ                                    | MEMORY_WRITE, VECTORIZED | MEMORY_READ |
| 48   | MEMORY_WRITE, HOISTED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -                        | VECTORIZED  |


### src/basic/MULTI_REDUCE-Seq.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                 | O3 Tags                                       | Only in O2  | Only in O3  |
| ---- | --------------------------------------- | --------------------------------------------- | ----------- | ----------- |
| 59   | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | MEMORY_WRITE, INLINE, CALL                    | MEMORY_READ | -           |
| 93   | MEMORY_WRITE, VECTORIZED, INLINE        | MEMORY_WRITE, MEMORY_READ, VECTORIZED, INLINE | -           | MEMORY_READ |


### src/basic/REDUCE_STRUCT-Seq.cpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags   |
| ---- | ------ |
| 149  | INLINE |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                   | O3 Tags                               | Only in O2 | Only in O3 |
| ---- | ------------------------- | ------------------------------------- | ---------- | ---------- |
| 205  | MEMORY_WRITE, MEMORY_READ | MEMORY_WRITE, VECTORIZED, MEMORY_READ | -          | VECTORIZED |


### src/common/KernelBase.hpp

**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags        |
| ---- | ----------- |
| 308  | MEMORY_READ |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags | O3 Tags             | Only in O2 | Only in O3  |
| ---- | ------- | ------------------- | ---------- | ----------- |
| 310  | INLINE  | MEMORY_READ, INLINE | -          | MEMORY_READ |


### src/lcals/FIRST_DIFF-Seq.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                        | Only in O2 | Only in O3 |
| ---- | ------------------------------------- | ---------------------------------------------- | ---------- | ---------- |
| 32   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL    | -          | CALL       |
| 45   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -          | HOISTED    |


### src/lcals/FIRST_SUM-Seq.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                        | Only in O2 | Only in O3 |
| ---- | ------------------------------------- | ---------------------------------------------- | ---------- | ---------- |
| 32   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL    | -          | CALL       |
| 45   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -          | HOISTED    |


### src/stream/ADD-Seq.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                        | Only in O2 | Only in O3 |
| ---- | ------------------------------------- | ---------------------------------------------- | ---------- | ---------- |
| 32   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL    | -          | CALL       |
| 45   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -          | HOISTED    |


### src/stream/COPY-Seq.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                        | Only in O2 | Only in O3 |
| ---- | ------------------------------------- | ---------------------------------------------- | ---------- | ---------- |
| 32   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL    | -          | CALL       |
| 45   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, HOISTED, VECTORIZED, MEMORY_READ | -          | HOISTED    |


### tpl/RAJA/include/RAJA/pattern/WorkGroup/Dispatcher.hpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags        |
| ---- | ----------- |
| 646  | MEMORY_READ |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags | O3 Tags             | Only in O2 | Only in O3  |
| ---- | ------- | ------------------- | ---------- | ----------- |
| 658  | INLINE  | MEMORY_READ, INLINE | -          | MEMORY_READ |


### tpl/RAJA/include/RAJA/pattern/kernel/For.hpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                 | Only in O2   | Only in O3 |
| ---- | ------------------------------------- | ----------------------- | ------------ | ---------- |
| 74   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | VECTORIZED, MEMORY_READ | MEMORY_WRITE | -          |
| 132  | MEMORY_WRITE, VECTORIZED, MEMORY_READ | VECTORIZED, MEMORY_READ | MEMORY_WRITE | -          |


### tpl/RAJA/include/RAJA/policy/sequential/reduce.hpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                       | O3 Tags                                             | Only in O2  | Only in O3 |
| ---- | --------------------------------------------- | --------------------------------------------------- | ----------- | ---------- |
| 52   | MEMORY_WRITE, MEMORY_READ, VECTORIZED, INLINE | MEMORY_WRITE, VECTORIZED, INLINE, CALL              | MEMORY_READ | CALL       |
| 58   | MEMORY_WRITE, MEMORY_READ, VECTORIZED, INLINE | MEMORY_READ, MEMORY_WRITE, INLINE, VECTORIZED, CALL | -           | CALL       |


### tpl/RAJA/include/RAJA/util/Layout.hpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                         | O3 Tags                   | Only in O2  | Only in O3   |
| ---- | ------------------------------- | ------------------------- | ----------- | ------------ |
| 60   | MEMORY_READ                     | MEMORY_WRITE, MEMORY_READ | -           | MEMORY_WRITE |
| 67   | MEMORY_WRITE, MEMORY_READ, CALL | MEMORY_WRITE, CALL        | MEMORY_READ | -            |


### tpl/RAJA/include/RAJA/util/Operators.hpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                       | O3 Tags                               | Only in O2 | Only in O3 |
| ---- | --------------------------------------------- | ------------------------------------- | ---------- | ---------- |
| 371  | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | CALL       | -          |
| 563  | MEMORY_WRITE, VECTORIZED, MEMORY_READ, INLINE | MEMORY_WRITE, VECTORIZED, MEMORY_READ | INLINE     | -          |


### tpl/RAJA/include/RAJA/util/Timer.hpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags              | O3 Tags                          | Only in O2 | Only in O3 |
| ---- | -------------------- | -------------------------------- | ---------- | ---------- |
| 114  | MEMORY_WRITE, CALL   | MEMORY_WRITE, VECTORIZED, CALL   | -          | VECTORIZED |
| 263  | MEMORY_WRITE, INLINE | MEMORY_WRITE, VECTORIZED, INLINE | -          | VECTORIZED |


### tpl/RAJA/include/RAJA/util/reduce.hpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags         |
| ---- | ------------ |
| 190  | MEMORY_WRITE |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags    | O3 Tags                  | Only in O2 | Only in O3   |
| ---- | ---------- | ------------------------ | ---------- | ------------ |
| 182  | VECTORIZED | MEMORY_WRITE, VECTORIZED | -          | MEMORY_WRITE |


### tpl/RAJA/include/RAJA/util/zip_tuple.hpp

**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags   |
| ---- | ------ |
| 302  | INLINE |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags      | O3 Tags                  | Only in O2 | Only in O3 |
| ---- | ------------ | ------------------------ | ---------- | ---------- |
| 114  | MEMORY_WRITE | MEMORY_WRITE, VECTORIZED | -          | VECTORIZED |


### tpl/RAJA/tpl/camp/include/camp/resource/host.hpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags        |
| ---- | ----------- |
| 82   | MEMORY_READ |


**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                                 | O3 Tags     | Only in O2                 | Only in O3 |
| ---- | --------------------------------------- | ----------- | -------------------------- | ---------- |
| 42   | MEMORY_WRITE, MEMORY_READ, INLINE, CALL | MEMORY_READ | MEMORY_WRITE, INLINE, CALL | -          |


### src/algorithm/MEMCPY.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags     | O3 Tags | Only in O2  | Only in O3 |
| ---- | ----------- | ------- | ----------- | ---------- |
| 66   | MEMORY_READ | INLINE  | MEMORY_READ | INLINE     |


### src/algorithm/MEMSET.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                           | O3 Tags              | Only in O2  | Only in O3 |
| ---- | --------------------------------- | -------------------- | ----------- | ---------- |
| 65   | MEMORY_WRITE, MEMORY_READ, INLINE | MEMORY_WRITE, INLINE | MEMORY_READ | -          |


### src/apps/EDGE3D-Seq.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                   | O3 Tags     | Only in O2   | Only in O3 |
| ---- | ------------------------- | ----------- | ------------ | ---------- |
| 46   | MEMORY_WRITE, MEMORY_READ | MEMORY_READ | MEMORY_WRITE | -          |


### src/basic/INIT_VIEW1D_OFFSET-Seq.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags             | O3 Tags              | Only in O2  | Only in O3   |
| ---- | ------------------- | -------------------- | ----------- | ------------ |
| 24   | MEMORY_READ, INLINE | MEMORY_WRITE, INLINE | MEMORY_READ | MEMORY_WRITE |


### src/lcals/INT_PREDICT.cpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                   | Only in O2 | Only in O3 |
| ---- | ------------------------------------- | ------------------------- | ---------- | ---------- |
| 66   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, MEMORY_READ | VECTORIZED | -          |


### tpl/RAJA/include/RAJA/index/ListSegment.hpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags      | O3 Tags                   | Only in O2 | Only in O3  |
| ---- | ------------ | ------------------------- | ---------- | ----------- |
| 127  | MEMORY_WRITE | MEMORY_WRITE, MEMORY_READ | -          | MEMORY_READ |


### tpl/RAJA/include/RAJA/pattern/detail/algorithm.hpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                 | O3 Tags                               | Only in O2 | Only in O3   |
| ---- | ----------------------- | ------------------------------------- | ---------- | ------------ |
| 75   | MEMORY_READ, VECTORIZED | MEMORY_WRITE, MEMORY_READ, VECTORIZED | -          | MEMORY_WRITE |


### tpl/RAJA/include/RAJA/pattern/kernel/internal/LoopData.hpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                 | Only in O2   | Only in O3 |
| ---- | ------------------------------------- | ----------------------- | ------------ | ---------- |
| 202  | MEMORY_WRITE, VECTORIZED, MEMORY_READ | VECTORIZED, MEMORY_READ | MEMORY_WRITE | -          |


### tpl/RAJA/include/RAJA/pattern/params/reducer.hpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                 | Only in O2   | Only in O3 |
| ---- | ------------------------------------- | ----------------------- | ------------ | ---------- |
| 127  | MEMORY_WRITE, MEMORY_READ, VECTORIZED | MEMORY_READ, VECTORIZED | MEMORY_WRITE | -          |


### tpl/RAJA/include/RAJA/pattern/sort.hpp

**Lines with tags ONLY in O3 (tags missing in O2):**


| Line | Tags         |
| ---- | ------------ |
| 76   | MEMORY_WRITE |


### tpl/RAJA/include/RAJA/policy/sequential/forall.hpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                               | O3 Tags                                     | Only in O2 | Only in O3 |
| ---- | ------------------------------------- | ------------------------------------------- | ---------- | ---------- |
| 74   | MEMORY_WRITE, VECTORIZED, MEMORY_READ | MEMORY_WRITE, VECTORIZED, MEMORY_READ, CALL | -          | CALL       |


### tpl/RAJA/include/RAJA/policy/sequential/params/reduce.hpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags                    |
| ---- | ----------------------- |
| 24   | VECTORIZED, MEMORY_READ |


### tpl/RAJA/include/RAJA/util/Span.hpp

**Lines with tags ONLY in O2 (tags missing in O3):**


| Line | Tags         |
| ---- | ------------ |
| 167  | MEMORY_WRITE |


### tpl/RAJA/tpl/camp/include/camp/resource.hpp

**Lines with DIFFERENT tags between O2 and O3:**


| Line | O2 Tags                  | O3 Tags                        | Only in O2 | Only in O3 |
| ---- | ------------------------ | ------------------------------ | ---------- | ---------- |
| 78   | MEMORY_WRITE, VECTORIZED | MEMORY_WRITE, VECTORIZED, CALL | -          | CALL       |


