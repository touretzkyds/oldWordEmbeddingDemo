function dot3(word)
  declare_globals
  [y, z, x, label] = word{:};
  blue = [0.2, 0.2, 1.0];
  plot3(x, y, z, 'o', 'MarkerSize', markersize3d, 'MarkerEdgeColor', blue, 'MarkerFaceColor', blue)
  text(x+0.2, y, z+0.5, label, 'FontSize', 15)
end

  
