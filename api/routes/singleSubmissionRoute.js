const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/singleSubmissionController.js');
const { Protect } = require('../Middleware/AuthMiddleware');

/* ======================= Submission with no time
{
  "language": "python",
  "version": "3.12.0",
  "code": "n = int(input())\narr = list(map(int, input().split()))\nprint(max(arr))",
  "problemId": "68df84abb7e93d5a30299a26"
}
*/

// ========================= Submission with Time
/* 
{
  "language": "python",
  "version": "3.12.0",
  "code": "n = int(input())\ns = input().strip()\ntotal_substrings = n * (n + 1) // 2\nres = 0\ncount = 0\nfor c in s:\n    if c == '1':\n        count += 1\n    else:\n        count = 0\n    res += count\nprint(total_substrings + res)",
  "problemId": "68e106b20ce06941bce29a7d",
  "elapsedTimeMs": 180000
}

*/

/*
{
  "language": "python",
  "version": "3.12.0",
  "code": "print(input())",
  "problemId": "68df84abb7e93d5a30299a26",
  "startedAt": "2025-10-03T14:20:00.000Z",
  "endedAt": "2025-10-03T14:22:15.295Z"
}

*/
router.post('/', Protect, submissionController.createSubmission);

/*GET http://localhost:5000/api/submissions */
router.get('/', Protect, submissionController.getSubmission);

/*http://localhost:5000/api/submissions/689f942e3b3659f0952d172a*/
router.get('/:id', Protect, submissionController.getSubmissionById);

/*PUT http://localhost:5000/api/submissions/689f942e3b3659f0952d172a \
'{
  "note": "This is my updated note"
}'
*/
router.put('/:id', Protect, submissionController.updateSubmission);

module.exports = router;

// ===================================================== Question 2 curl commands

/*
// (1) post
curl -X POST http://localhost:5000/api/submissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OWIyNWJkYTM2OGFjMmNjMDM5OGE0ZCIsImlhdCI6MTc1NDk5ODI3MSwiZXhwIjoxNzU1NjAzMDcxfQ._lBf2WBbJ1P6ZxuTlOtC-EXEm_XXAx3SUK1ULwZm38w" \
  -d '{
    "language": "python",
    "version": "3.12.0",
    "code": "MOD = 10**9 + 7\ns = input().strip()\nn = len(s)\npow10 = [1] * (n + 1)\nfor i in range(1, n + 1):\n    pow10[i] = (pow10[i - 1] * 10) % MOD\n\nprefix = [0] * (n + 1)\nfor i in range(n):\n    prefix[i + 1] = (prefix[i] * 10 + int(s[i])) % MOD\n\ntotal = 0\nfor i in range(n):\n    for j in range(i + 1, n + 1):\n        left = prefix[i]\n        right = (prefix[n] - prefix[j] * pow10[n - j]) % MOD\n        if right < 0:\n            right += MOD\n        val = (left * pow10[n - j] + right) % MOD\n        total = (total + val) % MOD\n\nprint(total)",
    "problemId": "689f4290dbb610a6990da83f"
  }'

// (2) get all
curl -X GET http://localhost:5000/api/submissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OWIyNWJkYTM2OGFjMmNjMDM5OGE0ZCIsImlhdCI6MTc1NDk5ODI3MSwiZXhwIjoxNzU1NjAzMDcxfQ._lBf2WBbJ1P6ZxuTlOtC-EXEm_XXAx3SUK1ULwZm38w"

// (3) get one
curl -X GET http://localhost:5000/api/submissions/689f942e3b3659f0952d172a \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OWIyNWJkYTM2OGFjMmNjMDM5OGE0ZCIsImlhdCI6MTc1NDk5ODI3MSwiZXhwIjoxNzU1NjAzMDcxfQ._lBf2WBbJ1P6ZxuTlOtC-EXEm_XXAx3SUK1ULwZm38w"


// (4) upadate note
curl -X PUT http://localhost:5000/api/submissions/689f942e3b3659f0952d172a \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OWIyNWJkYTM2OGFjMmNjMDM5OGE0ZCIsImlhdCI6MTc1NDk5ODI3MSwiZXhwIjoxNzU1NjAzMDcxfQ._lBf2WBbJ1P6ZxuTlOtC-EXEm_XXAx3SUK1ULwZm38w" \
  -d '{"note": "This is my updated note"}'

*/

// (I)    Take another example and test piston api
// (II)   Now have to make user points system and leaderboard
// - Rank 
// - badges

// (III)  Contest system