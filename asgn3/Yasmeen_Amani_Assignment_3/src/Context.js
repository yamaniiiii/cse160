export default function getContext() {
  const canvas = document.getElementById("webgl");

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const gl = canvas.getContext("webgl");
  if (!gl) {
    console.error("Failed to get the rendering context for WebGL");
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.enable(gl.DEPTH_TEST);

  window.addEventListener("resize", () => {
    gl.canvas.width  = window.innerWidth;
    gl.canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  });

  return gl;
}
