Before component generation find example in /Users/yurydunets/eduspace/preparing-for-ui-interview-v2-main/src
that repo provides best practices for creation UI component based on investigated problems
Lot's of useful advices we can get from /Users/yurydunets/eduspace/preparing-for-ui-interview-v2-main/src/problems 

DRY is broken:
const distribution: RatingDistribution = {
    1: data.distribution['1'] ?? 0,
    2: data.distribution['2'] ?? 0,
    3: data.distribution['3'] ?? 0,
    4: data.distribution['4'] ?? 0,
    5: data.distribution['5'] ?? 0,
  };

Max amount lines (code) in file 250 lines