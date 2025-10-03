const Problem = require("../models/SingleProblem");
const Solution = require("../models/SingleSolution");

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

// Personalized Problem Recommendations
exports.getPersonalizedProblems = async (req, res) => {
  try {
    const user = req.user; // from Protect middleware

    // Example: user model might contain solvedProblems, preferredDifficulty, preferredTags
    // You can expand this later as per your schema.
    const { solvedProblems = [], preferredDifficulty, preferredTags = [] } = user;

    // 1. Exclude problems already solved
    let query = { _id: { $nin: solvedProblems } };

    // 2. Filter by preferred difficulty (if user has one)
    if (preferredDifficulty) {
      query.difficulty = preferredDifficulty.toUpperCase();
    }

    // 3. Filter by preferred tags (if user has some)
    if (preferredTags.length > 0) {
      query.$or = [
        { tags: { $in: preferredTags.map(t => new RegExp(t, 'i')) } },
        { skill_types: { $in: preferredTags.map(t => new RegExp(t, 'i')) } },
        { raw_tags: { $in: preferredTags.map(t => new RegExp(t, 'i')) } }
      ];
    }

    // 4. Fetch problems (limit 10 to avoid overloading)
    const recommendedProblems = await Problem.find(query)
      .select("-solutions")
      .limit(10);

    // 5. If no personalized problems, fallback to random suggestions
    if (recommendedProblems.length === 0) {
      const randomProblems = await Problem.aggregate([{ $sample: { size: 5 } }]);
      return res.json({
        message: "No personalized problems found. Showing random problems instead.",
        problems: randomProblems
      });
    }

    res.json({
      user: user.email || user._id,
      count: recommendedProblems.length,
      personalized: true,
      problems: recommendedProblems
    });
  } catch (err) {
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
