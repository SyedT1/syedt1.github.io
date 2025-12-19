// Smooth fade-in
document.querySelectorAll("section").forEach((sec, i) => {
  sec.style.opacity = 0;
  setTimeout(() => {
    sec.style.transition = "opacity 0.8s ease";
    sec.style.opacity = 1;
  }, i * 150);
});
