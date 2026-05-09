NovaCare no-index-errors fix

Replace:
- lib/patientFirestore.js

What changed:
- Disabled collectionGroup fallback reads that were causing Firebase "requires COLLECTION_GROUP_ASC index" errors.
- Saved records are now loaded only from resolved patient document paths, including both the real Firestore doc ID and the visible Patient ID.
- Empty saved-record sections no longer trigger Firestore index errors.
- No need to create indexes for healthAssessments.caseNo, nurseNotes.caseNo, or imagingResults.caseNo.

After replacing:
1. Stop dev server.
2. Start again with npm run dev.
3. Hard refresh browser.
