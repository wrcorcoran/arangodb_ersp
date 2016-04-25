////////////////////////////////////////////////////////////////////////////////
/// DISCLAIMER
///
/// Copyright 2014-2016 ArangoDB GmbH, Cologne, Germany
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
/// @author Dr. Frank Celler
////////////////////////////////////////////////////////////////////////////////

#ifndef ARANGODB_BASICS_SYSTEM__FUNCTIONS_H
#define ARANGODB_BASICS_SYSTEM__FUNCTIONS_H 1

#ifndef TRI_WITHIN_COMMON
#error use <Basics/Common.h>
#endif

////////////////////////////////////////////////////////////////////////////////
/// @brief memrchr
////////////////////////////////////////////////////////////////////////////////

#ifdef TRI_MISSING_MEMRCHR
void* memrchr(void const* block, int c, size_t size);
#endif

////////////////////////////////////////////////////////////////////////////////
/// @brief get the time of day
////////////////////////////////////////////////////////////////////////////////

#ifdef TRI_HAVE_WIN32_GETTIMEOFDAY
int gettimeofday(struct timeval* tv, void* tz);
#endif

////////////////////////////////////////////////////////////////////////////////
/// @brief gets a line
////////////////////////////////////////////////////////////////////////////////

#ifndef TRI_HAVE_GETLINE
ssize_t getline(char**, size_t*, FILE*);
#endif

////////////////////////////////////////////////////////////////////////////////
/// @brief safe localtime
////////////////////////////////////////////////////////////////////////////////

void TRI_localtime(time_t, struct tm*);

////////////////////////////////////////////////////////////////////////////////
/// @brief safe gmtime
////////////////////////////////////////////////////////////////////////////////

void TRI_gmtime(time_t, struct tm*);

////////////////////////////////////////////////////////////////////////////////
/// @brief seconds with microsecond resolution
////////////////////////////////////////////////////////////////////////////////

double TRI_microtime();

////////////////////////////////////////////////////////////////////////////////
/// @brief return the current time as string in format "YYYY-MM-DDTHH:MM:SSZ"
////////////////////////////////////////////////////////////////////////////////

std::string TRI_timeString();

////////////////////////////////////////////////////////////////////////////////
/// @brief number of processors or 0
////////////////////////////////////////////////////////////////////////////////

size_t TRI_numberProcessors();

#endif
