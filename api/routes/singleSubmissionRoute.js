const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/singleSubmissionController');
const { Protect } = require('../Middleware/Token_Middleware');

/*
curl -X POST http://localhost:5000/api/submissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OWIyNWJkYTM2OGFjMmNjMDM5OGE0ZCIsImlhdCI6MTc1NDk5ODI3MSwiZXhwIjoxNzU1NjAzMDcxfQ._lBf2WBbJ1P6ZxuTlOtC-EXEm_XXAx3SUK1ULwZm38w" \
  -d '{
    "language": "python",
    "version": "3.12.0",
    "code": "MOD = 10**9 + 7\ns = input().strip()\nn = len(s)\npow10 = [1] * (n + 1)\nfor i in range(1, n + 1):\n    pow10[i] = (pow10[i - 1] * 10) % MOD\n\nprefix = [0] * (n + 1)\nfor i in range(n):\n    prefix[i + 1] = (prefix[i] * 10 + int(s[i])) % MOD\n\ntotal = 0\nfor i in range(n):\n    for j in range(i + 1, n + 1):\n        left = prefix[i]\n        right = (prefix[n] - prefix[j] * pow10[n - j]) % MOD\n        if right < 0:\n            right += MOD\n        val = (left * pow10[n - j] + right) % MOD\n        total = (total + val) % MOD\n\nprint(total)",
    "problemId": "689f4290dbb610a6990da83f"
  }'
*/
router.post('/', Protect, submissionController.createSubmission);

/*
curl -X GET http://localhost:5000/api/submissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OWIyNWJkYTM2OGFjMmNjMDM5OGE0ZCIsImlhdCI6MTc1NDk5ODI3MSwiZXhwIjoxNzU1NjAzMDcxfQ._lBf2WBbJ1P6ZxuTlOtC-EXEm_XXAx3SUK1ULwZm38w"
*/
router.get('/', Protect, submissionController.getSubmission);

/*
curl -X GET http://localhost:5000/api/submissions/689f942e3b3659f0952d172a \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OWIyNWJkYTM2OGFjMmNjMDM5OGE0ZCIsImlhdCI6MTc1NDk5ODI3MSwiZXhwIjoxNzU1NjAzMDcxfQ._lBf2WBbJ1P6ZxuTlOtC-EXEm_XXAx3SUK1ULwZm38w"
*/
router.get('/:id', Protect, submissionController.getSubmissionById);

/*
curl -X PUT http://localhost:5000/api/submissions/689f942e3b3659f0952d172a \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OWIyNWJkYTM2OGFjMmNjMDM5OGE0ZCIsImlhdCI6MTc1NDk5ODI3MSwiZXhwIjoxNzU1NjAzMDcxfQ._lBf2WBbJ1P6ZxuTlOtC-EXEm_XXAx3SUK1ULwZm38w" \
  -d '{"note": "This is my updated note"}'
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