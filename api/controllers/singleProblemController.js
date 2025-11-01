const Problem = require("../models/SingleProblem");
const Solution = require("../models/SingleSolution");

// Get total problems per difficulty
exports.getProblemStats = async (req, res) => {
  try {
    const validDifficulties = ["EASY", "MEDIUM", "HARD", "MEDIUM_HARD", "VERY_HARD"];

    // Count for each difficulty
    const counts = {};
    for (const level of validDifficulties) {
      counts[level] = await Problem.countDocuments({ difficulty: level });
    }

    // Total count (sum of all)
    const total = Object.values(counts).reduce((sum, c) => sum + c, 0);

    res.json({
      ...counts,
      TOTAL: total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch problem stats" });
  }
};



exports.bulkInsertProblems = async (req, res) => {
  try {
    const problemsArray = req.body; // array of { problem, solutions }

    let insertedProblems = [];

    for (const item of problemsArray) {
      const { problem, solutions } = item;

      // 1. Save problem
      const createdProblem = await Problem.create(problem);

      // 2. Save solutions (with problem reference)
      const solutionDocs = await Promise.all(
        solutions.map(sol =>
          Solution.create({
            problem: createdProblem._id,
            code: sol.code,
            language: sol.language,
            solutionNumber: sol.solutionNumber
          })
        )
      );

      // 3. Link solutions back to problem
      createdProblem.solutions = solutionDocs.map(s => s._id);
      await createdProblem.save();

      insertedProblems.push(await createdProblem.populate("solutions"));
    }

    res.status(201).json({ success: true, data: insertedProblems });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllProblems = async (req, res) => {
  const problems = await Problem.find();
  res.json(problems);
};

exports.getProblemById = async (req, res) => {
  try {
    const prob = await Problem.findById(req.params.id).populate("solutions");
    res.json(prob);
  } catch (err) {
    res.json({ error: err.message });
  }
};

// ======================================================
/*
Current Tags:

[
  "Combinatorics",
  "Mathematics",
  "Sorting",
  "Amortized analysis",
  "Dynamic programming",
  "Divide and conquer",
  "Data structures",
  "Arrays",
  "Implementation",
  "Constructive algorithms",
  "Greedy algorithms",
  "Basic Programming",
  "combinatorics",
  "math",
  "data structures",
  "binary search",
  "dp",
  "two pointers",
  "divide and conquer",
  "array",
  "implementation",
  "greedy",
  "constructive algorithms"
]

*/

// Personalized Problem Recommendations
// exports.getPersonalizedProblems = async (req, res) => {
//   try {
//     const user = req.user; // from Protect middleware

//     // Example: user model might contain solvedProblems, preferredDifficulty, preferredTags
//     // You can expand this later as per your schema.
//     const { solvedProblems = [], preferredDifficulty, preferredTags = [] } = user;

//     // 1. Exclude problems already solved
//     let query = { _id: { $nin: solvedProblems } };

//     // 2. Filter by preferred difficulty (if user has one)
//     if (preferredDifficulty) {
//       query.difficulty = preferredDifficulty.toUpperCase();
//     }

//     // 3. Filter by preferred tags (if user has some)
//     if (preferredTags.length > 0) {
//       query.$or = [
//         { tags: { $in: preferredTags.map(t => new RegExp(t, 'i')) } },
//         { skill_types: { $in: preferredTags.map(t => new RegExp(t, 'i')) } },
//         { raw_tags: { $in: preferredTags.map(t => new RegExp(t, 'i')) } }
//       ];
//     }

//     // 4. Fetch problems (limit 10 to avoid overloading)
//     const recommendedProblems = await Problem.find(query)
//       .select("-solutions")
//       .limit(10);

//     // 5. If no personalized problems, fallback to random suggestions
//     if (recommendedProblems.length === 0) {
//       const randomProblems = await Problem.aggregate([{ $sample: { size: 5 } }]);
//       return res.json({
//         message: "No personalized problems found. Showing random problems instead.",
//         problems: randomProblems
//       });
//     }

//     res.json({
//       user: user.email || user._id,
//       count: recommendedProblems.length,
//       personalized: true,
//       problems: recommendedProblems
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

/*

-> Features

| Feature                                 | Description                                                                                                    |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| ✅ **Supports `{tag, count}` structure** | Works with your new schema where tags are stored with frequency counts.                                        |
| 🎯 **Tag-weighted ranking**             | Prioritizes problems matching your most frequent tags (e.g., if user solves many `dp` problems, show more DP). |
| 💡 **Case-insensitive regex matching**  | Makes tag matching flexible (`dp`, `DP`, or `Dynamic Programming` all match).                                  |
| ⚙️ **Difficulty + Tags combined**       | First filters by preferred difficulty, then applies tag relevance.                                             |
| 🔁 **Fallback to random problems**      | If nothing matches personalization, still gives the user something to solve.                                   |


*/


// Personalized Problem Recommendations
exports.getPersonalizedProblems = async (req, res) => {
  try {
    const user = req.user; // from protect middleware

    // Destructure safely
    const {
      solvedProblems = [],
      preferredDifficulty,
      preferredTags = [],
    } = user;

    // 1️⃣ Base query — exclude solved problems
    const query = { _id: { $nin: solvedProblems } };

    // 2️⃣ Filter by preferred difficulty (if defined)
    if (preferredDifficulty) {
      query.difficulty = preferredDifficulty.toUpperCase();
    }

    // 3️⃣ Extract tags intelligently
    let tagList = [];

    if (Array.isArray(preferredTags) && preferredTags.length > 0) {
      // If your tags are stored as { tag: "dp", count: 3 }
      tagList = preferredTags.map((t) =>
        typeof t === "string" ? t : t.tag
      );
    }

    // Add tag-based query
    if (tagList.length > 0) {
      query.$or = [
        { tags: { $in: tagList.map((t) => new RegExp(t, "i")) } },
        { skill_types: { $in: tagList.map((t) => new RegExp(t, "i")) } },
        { raw_tags: { $in: tagList.map((t) => new RegExp(t, "i")) } },
      ];
    }

    // 4️⃣ Fetch top 10 matching problems (excluding solutions)
    let recommendedProblems = await Problem.find(query)
      .select("-solutions")
      .limit(10)
      .lean();

    // 5️⃣ Optional improvement: Sort by tag frequency (most relevant first)
    if (recommendedProblems.length > 1 && preferredTags.length > 0) {
      const tagWeights = Object.fromEntries(
        preferredTags.map((t) => [t.tag?.toLowerCase?.() || t, t.count || 1])
      );

      recommendedProblems = recommendedProblems.sort((a, b) => {
        const scoreA =
          (a.tags || []).reduce(
            (sum, tag) => sum + (tagWeights[tag.toLowerCase()] || 0),
            0
          );
        const scoreB =
          (b.tags || []).reduce(
            (sum, tag) => sum + (tagWeights[tag.toLowerCase()] || 0),
            0
          );
        return scoreB - scoreA; // higher score first
      });
    }

    // 6️⃣ Fallback: Random problems if no personalized matches
    if (recommendedProblems.length === 0) {
      const randomProblems = await Problem.aggregate([{ $sample: { size: 5 } }]);
      return res.json({
        message:
          "No personalized problems found. Showing random problems instead.",
        problems: randomProblems,
      });
    }

    // ✅ Final Response
    res.json({
      user: user.email || user._id,
      count: recommendedProblems.length,
      personalized: true,
      problems: recommendedProblems,
    });
  } catch (err) {
    console.error("getPersonalizedProblems error:", err);
    res.status(500).json({ error: err.message });
  }
};



// ======================================================


// Filter problems by difficulty level
exports.filterByDifficulty = async (req, res) => {
  try {
    const { level } = req.params;
    const validDifficulties = ["EASY", "MEDIUM", "HARD", "MEDIUM_HARD", "VERY_HARD"];
    
    if (!validDifficulties.includes(level.toUpperCase())) {
      return res.status(400).json({ 
        error: "Invalid difficulty level", 
        validLevels: validDifficulties 
      });
    }

    const problems = await Problem.find({ 
      difficulty: level.toUpperCase() 
    }).select('-solutions'); // exclude solutions for list view

    res.json({
      count: problems.length,
      difficulty: level.toUpperCase(),
      problems
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/*
Current Tags:

[
  "Combinatorics",
  "Mathematics",
  "Sorting",
  "Amortized analysis",
  "Dynamic programming",
  "Divide and conquer",
  "Data structures",
  "Arrays",
  "Implementation",
  "Constructive algorithms",
  "Greedy algorithms",
  "Basic Programming",
  "combinatorics",
  "math",
  "data structures",
  "binary search",
  "dp",
  "two pointers",
  "divide and conquer",
  "array",
  "implementation",
  "greedy",
  "constructive algorithms"
]

*/

// Filter problems by tags (supports multiple tags)
exports.filterByTags = async (req, res) => {
  try {
    const { tags } = req.query; // expects comma-separated tags
    
    if (!tags) {
      return res.status(400).json({ 
        error: "Please provide tags parameter",
        example: "?tags=Dynamic programming,Graph"
      });
    }

    const tagArray = tags.split(',').map(tag => tag.trim());
    
    const validTags = [
      "Divide and conquer",
      "Greedy",
      "Graph",
      "Math",
      "Mathematics",
      "Sorting",
      "Strings",
      "Dynamic programming",
      "Combinatorics",
      "Data structures",
      "Bit manipulation",
      "Recursion and backtracking"
    ];

    // Case-insensitive matching
    const problems = await Problem.find({
      $or: [
        { tags: { $in: tagArray.map(t => new RegExp(t, 'i')) } },
        { skill_types: { $in: tagArray.map(t => new RegExp(t, 'i')) } },
        { raw_tags: { $in: tagArray.map(t => new RegExp(t, 'i')) } }
      ]
    }).select('-solutions');

    res.json({
      count: problems.length,
      searchedTags: tagArray,
      problems
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Search problems by name or problem number
exports.searchProblems = async (req, res) => {
  try {
    const { q, source } = req.query; // q = query string
    
    if (!q) {
      return res.status(400).json({ 
        error: "Please provide search query",
        example: "?q=bargain or ?q=1422C&source=codeforces"
      });
    }

    let searchQuery = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    };

    // If searching by problem number with source
    if (source) {
      searchQuery.$or.push({
        source: { $regex: source, $options: 'i' },
        url: { $regex: q, $options: 'i' }
      });
    }

    const problems = await Problem.find(searchQuery).select('-solutions');

    res.json({
      count: problems.length,
      query: q,
      source: source || 'all',
      problems
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ======================================================

// Add problem
exports.createProblem = async (req, res) => {
  try {
    const problem = await Problem.create(req.body);
    res.status(201).json(problem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add Solution
exports.addSolution = async (req, res) => {
  try {
    const { id } = req.params; // problemId
    const { code, language, solutionNumber } = req.body;

    const problem = await Problem.findById(id);
    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    const solution = await Solution.create({
      problem: id,
      code,
      language,
      solutionNumber,
    });

    problem.solutions.push(solution._id);
    await problem.save();

    res.status(201).json(await solution.populate("problem", "name difficulty"));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Problem
exports.updateProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProblem = await Problem.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate("solutions");

    if (!updatedProblem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    res.json(updatedProblem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Solution
exports.updateSolution = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, language, solutionNumber } = req.body;

    const solution = await Solution.findByIdAndUpdate(
      id,
      { code, language, solutionNumber },
      { new: true }
    ).populate("problem", "name difficulty");

    if (!solution) {
      return res.status(404).json({ error: "Solution not found" });
    }

    res.json(solution);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Problem (also deletes its solutions)
exports.deleteProblem = async (req, res) => {
  try {
    const { id } = req.params;

    const problem = await Problem.findByIdAndDelete(id);
    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    // remove all solutions linked to this problem
    await Solution.deleteMany({ problem: id });

    res.json({ message: "Problem and its solutions deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Solution
exports.deleteSolution = async (req, res) => {
  try {
    const { id } = req.params;
    const solution = await Solution.findByIdAndDelete(id);

    if (!solution) {
      return res.status(404).json({ error: "Solution not found" });
    }

    // Also remove reference from Problem.solutions
    await Problem.findByIdAndUpdate(solution.problem, {
      $pull: { solutions: id },
    });

    res.json({ message: "Solution deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
