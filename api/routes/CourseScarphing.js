const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const route = express.Router();


function convertToMarkdown(contentBlocks) {
    let markdown = "";

    contentBlocks.forEach(block => {
        switch (block.type) {
            case "heading":
                markdown += `## ${block.data}\n\n`;
                break;

            case "text":
                markdown += `${block.data}\n\n`;
                break;

            case "code":
                markdown += `\`\`\`\n${block.data}\n\`\`\`\n\n`;
                break;

            case "list":
                block.data.forEach(item => {
                    markdown += `- ${item}\n`;
                });
                markdown += `\n`;
                break;

            default:
                break;
        }
    });

    return markdown.trim();
}



function parseElement($, el, blocks) {
    const tag = $(el).prop("tagName");

    if (tag === "H1" || tag === "H2" || tag === "H3" || tag === "H4") {
        const heading = $(el).text().trim();
        if (heading) blocks.push({ type: "heading", data: heading });
    }

    else if (tag === "P") {
        const text = $(el).text().trim();
        if (text) blocks.push({ type: "text", data: text });
    }

    else if (tag === "UL" || tag === "OL") {
        const listItems = $(el)
            .find("li")
            .map((i, li) => $(li).text().trim())
            .get();
        if (listItems.length) blocks.push({ type: "list", data: listItems });
    }

    else if ($(el).hasClass("w3-code") || $(el).find(".w3-code").length > 0 || tag === "PRE" || $(el).find("pre").length > 0) {
        const code = $(el).text().trim();
        if (code && code.length < 500 && !code.startsWith("var ") && !code.startsWith("JSON.parse")) {
            blocks.push({ type: "code", data: code });
        }
    }

    $(el)
        .children()
        .each((i, child) => parseElement($, child, blocks));
}


route.post("/", async (req, res) => {
    try {
        const { topic, category, platformLink } = req.body;
        const url = platformLink;

        console.log("Scraping from:", url);

        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        let mainContent;
        if (url.includes("w3schools")) {
            mainContent = $("#main").first();
        } else if (url.includes("geeksforgeeks")) {
            mainContent = $(".entry-content, .content, article").first();
        } else {
            mainContent = $("body").first(); // fallback
        }

        const contentBlocks = [];

        mainContent.children().each((i, el) => parseElement($, el, contentBlocks));

        let title = $("h1").first().text().trim() || $("title").text().trim();

        return res.json({
            message: "Data fetched successfully",
            data: {
                title: title.split("/")[0].trim(),
                sourceURL: url,
                contentBlocks: convertToMarkdown(contentBlocks),
            },
        });
    } catch (error) {
        console.error("Scraping failed:", error.message);
        return res.status(500).json({
            error: "Could not fetch data. Check URL format or site structure.",
        });
    }
});


route.get("/preview", async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).send("Missing ?url parameter");
    }

    try {
        const response = await axios.get(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
        });

        let html = response.data;

        const baseUrl = new URL(url).origin;
        html = html.replace(/(src|href)="\/(?!\/)/g, `$1="${baseUrl}/`);

        res.set("Content-Type", "text/html");
        res.send(html);
    } catch (error) {
        console.error("Error fetching preview:", error.message);
        res.status(500).send(`<p style="color:red">Error loading preview.</p>`);
    }
});

module.exports = route;
