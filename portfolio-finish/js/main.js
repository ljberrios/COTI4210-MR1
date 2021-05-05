const linksTablesRows = document.querySelectorAll("tr");

linksTablesRows.forEach((row) => {
  row.onclick = () => {
    window.open(row.getAttribute("data-href"), "_blank");
  };
});
