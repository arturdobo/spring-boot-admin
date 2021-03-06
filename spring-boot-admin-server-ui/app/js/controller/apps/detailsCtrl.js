/*
 * Copyright 2014 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

module.exports = function ($scope, $interval, application, MetricsHelper) {
    $scope.application = application;

    var start = Date.now();
    $interval(function () {
        $scope.ticks = Date.now() - start;
    }, 1000);

    application.getInfo()
        .then(function (info) {
            $scope.info = info;
        })
        .catch(function (error) {
            $scope.error = error;
        });

    application.getHealth()
        .then(function (health) {
            $scope.health = health;
        })
        .catch(function (health) {
            $scope.health = health;
        });

    $scope.isHealthDetail = function (key, value) {
        return key !== 'status' && value !== null && (Array.isArray(value) || typeof value !== 'object');
    };

    $scope.isChildHealth = function (key, health) {
        return health !== null && !Array.isArray(health) && typeof health === 'object';
    };

    application.getMetrics()
        .then(function (metrics) {
            $scope.metrics = metrics;
            $scope.metrics['mem.used'] = $scope.metrics.mem - $scope.metrics['mem.free'];

            $scope.gcInfos = {};
            $scope.datasources = {};
            $scope.caches = {};

            function createOrGet(map, key, factory) {
                return map[key] || (map[key] = factory());
            }

            MetricsHelper.find(metrics, [/gc\.(.+)\.time/, /gc\.(.+)\.count/,
                /datasource\.(.+)\.active/, /datasource\.(.+)\.usage/,
                /cache\.(.+)\.size/, /cache\.(.+)\.miss\.ratio/, /cache\.(.+)\.hit\.ratio/
            ], [function (metric, match, value) {
                    createOrGet($scope.gcInfos, match[1], function () {
                            return { time: 0, count: 0 };
                        })
                        .time = value;
                },
                function (metric, match, value) {
                    createOrGet($scope.gcInfos, match[1], function () {
                            return { time: 0, count: 0 };
                        })
                        .count = value;
                },
                function (metric, match, value) {
                    $scope.hasDatasources = true;
                    createOrGet($scope.datasources, match[1], function () {
                            return { min: 0, max: 0, active: 0, usage: 0 };
                        })
                        .active = value;
                },
                function (metric, match, value) {
                    $scope.hasDatasources = true;
                    createOrGet($scope.datasources, match[1], function () {
                            return { min: 0, max: 0, active: 0, usage: 0 };
                        })
                        .usage = value;
                },
                function (metric, match, value) {
                    $scope.hasCaches = true;
                    createOrGet($scope.caches, match[1], function () {
                            return { size: 0, hitRatio: 0.0, missRatio: 0.0 };
                        })
                        .size = value;
                },
                function (metric, match, value) {
                    $scope.hasCaches = true;
                    createOrGet($scope.caches, match[1], function () {
                            return { size: 0, hitRatio: 0.0, missRatio: 0.0 };
                        })
                        .missRatio = value;
                },
                function (metric, match, value) {
                    $scope.hasCaches = true;
                    createOrGet($scope.caches, match[1], function () {
                            return { size: 0, hitRatio: 0.0, missRatio: 0.0 };
                        })
                        .hitRatio = value;
                }
            ]);
        })
        .catch(function (error) {
            $scope.error = error;
        });
};
