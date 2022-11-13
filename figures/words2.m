% Word definitions for 2D plots

w_man     =     {1, 7, 'man'};
w_woman   =     {9, 7, 'woman'};
w_boy     =     {1, 2, 'boy'};
w_girl    =     {9, 2, 'girl'};
w_adult =       {5, 7, 'adult'};
w_teenager =    {5, 5, 'teenager'};
w_child =       {5, 2, 'child'};
w_infant =      {5, 1, 'infant'};
w_grandfather = {1, 9, 'grandfather'};
w_grandparent = {5, 9, 'grandparent'};
w_grandmother = {9, 9, 'grandmother'};
w_octogenarian = {5, 9.5, 'octogenarian'};

words = [w_man; w_woman; w_boy; w_girl; ...
	      w_adult; w_child; w_infant; w_grandfather];

words = [w_grandfather; w_man; w_adult; w_woman; ...
         w_boy; w_child; w_girl; w_infant ];
