const Problem = require('../Models/SingleProblem');
const Solution = require('../Models/SingleSolution');

exports.getAllProblems = async (req, res) => {
    const problems = await Problem.find();
    console.log('hello');
    res.json(problems);
}

exports.getProblemById = async (req, res) => {
    try{
        const prob = await Problem.findById(req.params.id).populate('solutions');
        res.json(prob);
    }
    catch(err){
        res.json({ error: err.message })
    }
}

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
      solutionNumber
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
      $pull: { solutions: id }
    });

    res.json({ message: "Solution deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};