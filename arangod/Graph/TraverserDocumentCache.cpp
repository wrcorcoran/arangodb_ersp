////////////////////////////////////////////////////////////////////////////////
/// DISCLAIMER
///
/// Copyright 2014-2023 ArangoDB GmbH, Cologne, Germany
/// Copyright 2004-2014 triAGENS GmbH, Cologne, Germany
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///
/// Copyright holder is ArangoDB GmbH, Cologne, Germany
///
/// @author Michael Hackstein
////////////////////////////////////////////////////////////////////////////////

#include "TraverserDocumentCache.h"

#include "ApplicationFeatures/ApplicationServer.h"
#include "Aql/AqlValue.h"
#include "Aql/QueryContext.h"
#include "Basics/VelocyPackHelper.h"
#include "Basics/debugging.h"
#include "Cache/Cache.h"
#include "Cache/CacheManagerFeature.h"
#include "Cache/Common.h"
#include "Cache/Finding.h"
#include "Cluster/ServerState.h"
#include "Graph/EdgeDocumentToken.h"
#include "Logger/LogMacros.h"
#include "Logger/Logger.h"
#include "Logger/LoggerStream.h"

#include <velocypack/Builder.h>
#include <velocypack/Slice.h>

using namespace arangodb;
using namespace arangodb::graph;

TraverserDocumentCache::TraverserDocumentCache(
    aql::QueryContext& query, std::shared_ptr<arangodb::cache::Cache> cache,
    BaseOptions* options)
    : TraverserCache(query, options), _cache(std::move(cache)) {
  TRI_ASSERT(_cache != nullptr);
}

TraverserDocumentCache::~TraverserDocumentCache() {
  TRI_ASSERT(_cache != nullptr);
  auto cacheManager =
      _query.vocbase().server().getFeature<CacheManagerFeature>().manager();
  if (cacheManager != nullptr) {
    try {
      cacheManager->destroyCache(std::move(_cache));
      _cache.reset();
    } catch (...) {
      // no exceptions allowed here
    }
  }
}

// @brief Only for internal use, Cache::Finding prevents
// the cache from removing this specific object. Should not be retained
// for a longer period of time.
// DO NOT give it to a caller.
cache::Finding TraverserDocumentCache::lookup(std::string_view idString) {
  return _cache->find(idString.data(),
                      static_cast<uint32_t>(idString.length()));
}

// These two do not use the cache.
void TraverserDocumentCache::insertEdgeIntoResult(
    EdgeDocumentToken const& idToken, VPackBuilder& builder) {
  TRI_ASSERT(!ServerState::instance()->isCoordinator());
  builder.add(lookupToken(idToken));
}

aql::AqlValue TraverserDocumentCache::fetchEdgeAqlResult(
    EdgeDocumentToken const& idToken) {
  TRI_ASSERT(!ServerState::instance()->isCoordinator());
  return aql::AqlValue(lookupToken(idToken));
}

void TraverserDocumentCache::insertIntoCache(
    std::string_view id, arangodb::velocypack::Slice const& document) {
  void const* key = id.data();
  auto keySize = static_cast<uint32_t>(id.length());

  void const* resVal = document.begin();
  uint64_t resValSize = static_cast<uint64_t>(document.byteSize());
  std::unique_ptr<cache::CachedValue> value(
      cache::CachedValue::construct(key, keySize, resVal, resValSize));

  if (value) {
    auto result = _cache->insert(value.get());
    if (result != TRI_ERROR_NO_ERROR) {
      LOG_TOPIC("9de3a", TRACE, Logger::GRAPHS) << "cache insert failed";
    } else {
      // Cache is responsible.
      // If this failed, well we do not store it and read it again next time.
      value.release();
    }
  }
}
