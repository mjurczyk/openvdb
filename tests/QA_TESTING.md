# Library Testing

All packages in the library are covered with a unified test suite.

1. Complete the feature implementation or assignment.
2. Run `npm run test` on your local deployment, where the code is already updated to contain your changes.
3. If all cases pass, skip further instructions in this file.

4. If ANY case fails continue further on.
5. ONLY for scenarios that cross the allowed thresholds, do the following:

  a) DO NOT modify the validation-set JPGs
  b) Combine your rendered JPG with the equivalent validation-set JPG, by stitching them together horizontally into a single JPG of 2xW 1xH, in a side-by-side, non-overlapping layout. Stitched JPG should override your original `*-actual` captured JPG that was marked as failing.

6. After you have stitched all failing JPG couples, delete all NON-FAILING JPGs from the `tests/results/` directory.
7. Open `tests/results/` directory for the user using `open` command (or system equivalent) and allow for manual QA.
8. If user approves the results as correct - continue with the work as QA has passed.
9. If user rejects the results - the feature or assignment need to be fixed to match quality standards. 