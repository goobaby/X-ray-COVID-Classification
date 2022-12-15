
Required installations:
   https://nodejs.org/en/


1. Ensure that the full dataset is in a folder called 'data' in the same directory as split.js.  Ensure that the
   corresponding annotations.json and rows.json files are also present in the same directory as split.js.

2. Ensure that a folder named 'split' does not already exist at the current directory. If it does, the script
   won't run and will produce an error message.

3. Ensure that you have at least 6 GB free on the drive that you are running this on. It is going to make copy
   the data, so anticipate that and ensure you have the extra space.

4. Run via the command 'node split.js'

5. Wait for the script to finish. The result should be a directory named 'split' containing the test and
   train folders. This folder is now ready to be used with the preprocessing pipeline.
