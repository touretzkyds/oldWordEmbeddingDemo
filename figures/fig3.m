setup_params

clf
axis([0 10 0 10 0 10])
%axis square
set(gca, 'xtick', 0:10)
set(gca, 'ytick', 0:10)
set(gca, 'ztick', 0:10)
box on
grid on
hold on

  view(-6.8, 10)

  words3   % load word definitions

  dot3(w_man)
  dot3(w_woman)
  dot3(w_boy)
  dot3(w_girl)

  dot3(w_king)
  dot3(w_queen)
  dot3(w_prince)
  dot3(w_princess)

  ylabel('Gender', 'Fontsize', 15)
  zlabel('Age', 'Fontsize', 15)
  xlabel('Royalty', 'FontSize', 15)
  title('3D Semantic Feature Space', 'FontSize', 20)

  savefigure("fig3.png")
