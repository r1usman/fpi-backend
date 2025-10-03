const express = require('express');
const router = express.Router();
const problemController = require('../controllers/singleProblemController');

const { Protect } = require('../Middleware/AuthMiddleware');
const { adminAccess } = require('../Middleware/AdminAccess');


// ============================================
// Problem searching and filtering
// ============================================

// curl -X GET http://localhost:5000/api/problems
router.get('/', problemController.getAllProblems);

// curl -X GET http://localhost:5000/api/problems/68958f856f85ddae60d1a773
router.get('/:id', problemController.getProblemById);

// Filter by difficulty
router.get('/filter/difficulty/:level', problemController.filterByDifficulty);

// Filter by tags
router.get('/filter/tags', problemController.filterByTags);

// Search by name or number
router.get('/search', problemController.searchProblems);

// ============================================
// Personalized problem for Student 
// ============================================
/*
- User’s past submissions 
  (solved vs unsolved).

- Skill level 
  (if you store rating or solved stats per difficulty).

- Tag preferences 
  (e.g., if user solved many Graph problems, suggest DP problems).

*/

router.get('/personalized', Protect, problemController.getPersonalizedProblems);


// ============================================
// Problem, Solution Addition by Admin
// ============================================

// Problems
router.post("/", Protect, adminAccess, problemController.createProblem);
router.put("/:id", Protect, adminAccess, problemController.updateProblem);
router.delete("/:id", Protect, adminAccess, problemController.deleteProblem);

// Solutions
router.post("/:id/solutions", Protect, adminAccess, problemController.addSolution);
router.put("/solutions/:id", Protect, adminAccess, problemController.updateSolution);
router.delete("/solutions/:id", Protect, adminAccess, problemController.deleteSolution);

module.exports = router;

// *************************************************************************
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

/*
{
  // ========================================= (2) Name, source, difficulty

  "_id": {
    "$oid": "68958f856f85ddae60d1a773"
  },

  "difficulty": "MEDIUM_HARD",

  "name": null,

  "source": "codeforces",
  
  // ========================================= (2) Tags

  "raw_tags": [
    "combinatorics",
    "math",
    "dp"
  ],

  "tags": [
    "Dynamic programming",
    "Combinatorics",
    "Mathematics"
  ],

  "skill_types": [
    "Dynamic programming"
  ],


  // ========================================= (3) other detail

  "url": "https://codeforces.com/problemset/problem/1422/C",

  "Expected Auxiliary Space": null,
  
  "Expected Time Complexity": null,
  
  "time_limit": "1 second",
  
  "date": "2020-10-04",
  
  "picture_num": "0",
  
  "memory_limit": "256 megabytes",


  // ========================================= (4) Desc, Input, Output, Note

  "Description": "Sometimes it is not easy to come to an agreement in a bargain. Right now Sasha and Vova can't come to an agreement: Sasha names a price as high as possible, then Vova wants to remove as many digits from the price as possible. In more details, Sasha names some integer price $n$, Vova removes a non-empty substring of (consecutive) digits from the price, the remaining digits close the gap, and the resulting integer is the price.\n\nFor example, is Sasha names $1213121$, Vova can remove the substring $1312$, and the result is $121$.\n\nIt is allowed for result to contain leading zeros. If Vova removes all digits, the price is considered to be $0$.\n\nSasha wants to come up with some constraints so that Vova can't just remove all digits, but he needs some arguments supporting the constraints. To start with, he wants to compute the sum of all possible resulting prices after Vova's move.\n\nHelp Sasha to compute this sum. Since the answer can be very large, print it modulo $10^9 + 7$.",
  
  "Input": "The first and only line contains a single integer $n$ ($1 \\le n < 10^{10^5}$).",
  
  "Output": "In the only line print the required sum modulo $10^9 + 7$.",
  
  "Note": "Consider the first example.\n\nVova can choose to remove $1$, $0$, $7$, $10$, $07$, or $107$. The results are $07$, $17$, $10$, $7$, $1$, $0$. Their sum is $42$.",
  

  // ========================================= (5) solutions, examples

  "solutions": [
    {
      "$oid": "6895a3e4ac0d1bd9cfda5448"
    },
    {
      "$oid": "6895a3e4ac0d1bd9cfda5449"
    },
    {
      "$oid": "6895a3e4ac0d1bd9cfda544a"
    },
    {
      "$oid": "6895a3e4ac0d1bd9cfda544b"
    }
  ],

  "examples": [
    {
      "input": "107",
      "output": "42"
    },
    {
      "input": "100500100500",
      "output": "428101984"
    }
  ]
}
*/

/*
================= Solution 1

{
  "_id": {
    "$oid": "6895a3e4ac0d1bd9cfda5448"
  },
  "code": "MOD = 10**9 + 7\ns = input().strip()\nn = len(s)\npow10 = [1] * (n + 1)\nfor i in range(1, n + 1):\n    pow10[i] = (pow10[i - 1] * 10) % MOD\n\nprefix = [0] * (n + 1)\nfor i in range(n):\n    prefix[i + 1] = (prefix[i] * 10 + int(s[i])) % MOD\n\ntotal = 0\nfor i in range(n):\n    for j in range(i + 1, n + 1):\n        left = prefix[i]\n        right = (prefix[n] - prefix[j] * pow10[n - j]) % MOD\n        if right < 0:\n            right += MOD\n        val = (left * pow10[n - j] + right) % MOD\n        total = (total + val) % MOD\n\nprint(total)",
  "language": "python",
  "problemId": {
    "$oid": "68958f856f85ddae60d1a773"
  },
  "solutionNumber": 1
}
*/

/*
================= Solution 2

{
  "_id": {
    "$oid": "6895a3e4ac0d1bd9cfda5449"
  },
  "code": "#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\n\nconst int MOD = 1e9 + 7;\n\nint main() {\n    string s;\n    cin >> s;\n    int n = s.size();\n    vector<long long> pow10(n + 1, 1), prefix(n + 1, 0);\n    for (int i = 1; i <= n; ++i)\n        pow10[i] = (pow10[i - 1] * 10) % MOD;\n    for (int i = 0; i < n; ++i)\n        prefix[i + 1] = (prefix[i] * 10 + (s[i] - '0')) % MOD;\n\n    long long total = 0;\n    for (int i = 0; i < n; ++i) {\n        for (int j = i + 1; j <= n; ++j) {\n            long long left = prefix[i];\n            long long right = (prefix[n] - prefix[j] * pow10[n - j]) % MOD;\n            if (right < 0) right += MOD;\n            long long val = (left * pow10[n - j] + right) % MOD;\n            total = (total + val) % MOD;\n        }\n    }\n    cout << total << endl;\n    return 0;\n}",
  "language": "cpp",
  "problemId": {
    "$oid": "68958f856f85ddae60d1a773"
  },
  "solutionNumber": 2
}
*/

/*
================= Solution 3

{
  "_id": {
    "$oid": "6895a3e4ac0d1bd9cfda544a"
  },
  "code": "const MOD = 1e9 + 7;\nconst s = require('fs').readFileSync(0, 'utf-8').trim();\nconst n = s.length;\nconst pow10 = Array(n + 1).fill(1);\nfor (let i = 1; i <= n; ++i)\n    pow10[i] = (pow10[i - 1] * 10) % MOD;\n\nconst prefix = Array(n + 1).fill(0);\nfor (let i = 0; i < n; ++i)\n    prefix[i + 1] = (prefix[i] * 10 + Number(s[i])) % MOD;\n\nlet total = 0;\nfor (let i = 0; i < n; ++i) {\n    for (let j = i + 1; j <= n; ++j) {\n        const left = prefix[i];\n        let right = (prefix[n] - prefix[j] * pow10[n - j]) % MOD;\n        if (right < 0) right += MOD;\n        const val = (left * pow10[n - j] + right) % MOD;\n        total = (total + val) % MOD;\n    }\n}\nconsole.log(total);",
  "language": "javascript",
  "problemId": {
    "$oid": "68958f856f85ddae60d1a773"
  },
  "solutionNumber": 3
}
*/

/*
================= Solution 4

{
  "_id": {
    "$oid": "6895a3e4ac0d1bd9cfda544b"
  },
  "code": "import java.util.*;\npublic class Main {\n    static final int MOD = 1000000007;\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.next();\n        int n = s.length();\n        long[] pow10 = new long[n + 1];\n        pow10[0] = 1;\n        for (int i = 1; i <= n; i++)\n            pow10[i] = (pow10[i - 1] * 10) % MOD;\n        long[] prefix = new long[n + 1];\n        for (int i = 0; i < n; i++)\n            prefix[i + 1] = (prefix[i] * 10 + (s.charAt(i) - '0')) % MOD;\n        long total = 0;\n        for (int i = 0; i < n; i++) {\n            for (int j = i + 1; j <= n; j++) {\n                long left = prefix[i];\n                long right = (prefix[n] - prefix[j] * pow10[n - j]) % MOD;\n                if (right < 0) right += MOD;\n                long val = (left * pow10[n - j] + right) % MOD;\n                total = (total + val) % MOD;\n            }\n        }\n        System.out.println(total);\n    }\n}",
  "language": "java",
  "problemId": {
    "$oid": "68958f856f85ddae60d1a773"
  },
  "solutionNumber": 4
}
*/