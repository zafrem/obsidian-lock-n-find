// src/api/routes/search.ts
import type { App } from "obsidian";
import { SearchRequest, SearchResult, ApiError, ApiErrorCode } from "../types";

/**
 * Handle search requests (both regex and direct)
 */
export async function handleSearchRequest(
  app: App,
  body: SearchRequest,
  type: "regex" | "direct"
): Promise<SearchResult[]> {
  // Validate request
  if (!body.query || typeof body.query !== "string") {
    throw new ApiError(
      ApiErrorCode.INVALID_REQUEST,
      "Query is required and must be a string",
      400
    );
  }

  const caseSensitive = body.caseSensitive ?? false;
  const maxResults = body.maxResults ?? 1000;

  if (maxResults < 1 || maxResults > 10000) {
    throw new ApiError(
      ApiErrorCode.INVALID_REQUEST,
      "maxResults must be between 1 and 10000",
      400
    );
  }

  const results: SearchResult[] = [];
  const files = app.vault.getMarkdownFiles();

  if (type === "regex") {
    // Regex search
    let regex: RegExp;
    try {
      const flags = caseSensitive ? "g" : "gi";
      regex = new RegExp(body.query, flags);
    } catch (error) {
      throw new ApiError(
        ApiErrorCode.INVALID_REGEX,
        `Invalid regular expression: ${error instanceof Error ? error.message : "Unknown error"}`,
        400
      );
    }

    for (const file of files) {
      if (results.length >= maxResults) break;

      const content = await app.vault.cachedRead(file);
      const lines = content.split("\n");

      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        if (results.length >= maxResults) break;

        const lineText = lines[lineNum];

        // Reset regex lastIndex to avoid skipping matches
        regex.lastIndex = 0;

        let match: RegExpExecArray | null;
        while ((match = regex.exec(lineText)) !== null) {
          if (results.length >= maxResults) break;

          results.push({
            file: file.path,
            line: lineNum,
            col: match.index,
            text: match[0],
            context: lineText.trim(),
          });

          // Prevent infinite loop for zero-width matches
          if (match.index === regex.lastIndex) {
            regex.lastIndex++;
          }
        }
      }
    }
  } else {
    // Direct text search
    const query = caseSensitive ? body.query : body.query.toLowerCase();

    for (const file of files) {
      if (results.length >= maxResults) break;

      const content = await app.vault.cachedRead(file);
      const lines = content.split("\n");

      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        if (results.length >= maxResults) break;

        const lineText = lines[lineNum];
        const searchLine = caseSensitive ? lineText : lineText.toLowerCase();

        let index = 0;
        while ((index = searchLine.indexOf(query, index)) !== -1) {
          if (results.length >= maxResults) break;

          results.push({
            file: file.path,
            line: lineNum,
            col: index,
            text: lineText.substring(index, index + body.query.length),
            context: lineText.trim(),
          });

          index += body.query.length;
        }
      }
    }
  }

  return results;
}
