const notice = document.querySelector("#notice");
const fileUpload = document.querySelector("#file-upload");

const messages = {
  github: "GitHub 连接入口已准备好，接下来可以接入 OAuth。",
  gitlab: "GitLab 连接入口已准备好，接下来可以接入 OAuth。",
  hello: "Hello World 模板已选中，边缘函数正在热身。",
  template: "模板中心即将开放，先给它留个漂亮的位置。",
};

function showNotice(message) {
  notice.textContent = message;
}

document.querySelectorAll("[data-action]").forEach((element) => {
  const action = element.dataset.action;

  if (action === "upload") {
    element.addEventListener("click", () => fileUpload.click());
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        fileUpload.click();
      }
    });
    return;
  }

  element.addEventListener("click", () => showNotice(messages[action]));
});

fileUpload.addEventListener("change", () => {
  const count = fileUpload.files.length;
  if (count > 0) showNotice(`已选择 ${count} 个文件，准备交给 Worker。`);
});
