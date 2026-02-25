
// geminiService.ts — Legacy service, kept for compatibility.
// All matching now goes through authService / fetch directly in Matchmaker.tsx
// using the new /match/{username} endpoint.

export const geminiService = {
  // Deprecated — matching is now handled via POST /match/{username} in Matchmaker.tsx
};

export default geminiService;
