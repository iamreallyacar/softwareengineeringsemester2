function importAll(r) {
    r.keys().forEach(r);
  }
  
  importAll(require.context('./css', false, /\.css$/));