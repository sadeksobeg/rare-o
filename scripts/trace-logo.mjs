import potrace from "potrace";
import fs from "node:fs";

const { trace } = potrace;

function run(input, output, color) {
  trace(input, { threshold: 128, color, background: "transparent", optTolerance: 0.2 }, (err, svg) => {
    if (err) throw err;
    fs.writeFileSync(output, svg);
    console.log("wrote", output);
  });
}

run("public/brand/mark-master.png", "docs/ui/design/mockups/assets/logo-mark.svg", "#0B080D");
run("public/brand/mark-small.png", "docs/ui/design/mockups/assets/logo-mark-small.svg", "#0B080D");
