Video Link: https://www.youtube.com/watch?v=OJhiQaDeXlI
Data Link: https://drive.google.com/file/d/1dh0B-zhUlg598QZhcxy3d2qN2gfpNx2r/view?usp=share_link

Instructions:

1) Navigate your way to the ./code/ directory and open the "dataSplitting" folder. Inside here
is where you will obtain one split of data(before conversions to numpy arrays happen). Open the "Readme"
file and follow instructions 1 - 5.

2) Once a split of data is complete and inside the directory ./dataSplitting/, run through the 
entire Jupyter Source File called "converting". This will convert the split from step 1 into
numpy arrays and the proper data types before being ran through the model. 
NOTE: This process will take about 40 minutes - 1 hour to complete. 

3) Once "converting" is complete, there will be 4 files present in the ./dataSplitting/ directory. They
will be called:
	1) test_image_arrays.npy
	2) test_labels.npy
	3) train_image_arrays.npy
	4) train_labels.npy

4) Drag these 4 numpy files into the directory called ./code/ 

5) Run through the Jupyter Source File named "final" inside of ./code. This file will load those
4 numpy files and pre-process the images before running through the model.  

6) Once "final" has been run, you have successfuly completed one split of data. The model will
save the weights. 

7) Delete the 4 numpy files from the ./code/ directory and from the ./dataSplitting/ directory. Also, delete
the folder called "split" that appeared after completing step 1). 

8) Repeat step 1 through step 8 nine more times to fully train the model and obtain high validation accuracy.


