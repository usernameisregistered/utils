const config = require("./config.json");
const fs = require("fs");
const path = require("path");
let absDir = config.output;
function generateDir() {
    if (!path.isAbsolute(absDir)) {
        absDir = path.join(__dirname, absDir)
    }
    
    try {
        let stat = fs.statSync(absDir);
        if (stat.isDirectory() === true) {
            console.log(`目录已经存在 ${absDir}`)
        }
    } catch {
        fs.mkdirSync(absDir);
        console.log(`创建目录 ${absDir}`)
    }
}

function getFiles(rootPath) {
    let allFiles = {
        images: [],
        noImages: []
    }
    function findFile(dir) {
        let files = fs.readdirSync(dir);
        files.forEach(function (item) {
            let fPath = path.join(dir, item);
            let stat = fs.statSync(fPath);
            if (stat.isDirectory() === true) {
                findFile(fPath);
            }
            if (stat.isFile() === true) {
                let ext = path.extname(fPath).slice(1);
                if (config.fileTypes.includes(ext)) {
                    allFiles.images.push(fPath.replace(/\\/g, "/"));
                } else {
                    allFiles.noImages.push(fPath.replace(/\\/g, "/"));
                }
            }
        });
    }
    findFile(rootPath);
    return allFiles;
}

function findImage(resources) {
    let useImageFile = [];
    for (let imagePath of resources.images) {
        const shortImagePath = imagePath.split("/").slice(-2).join("/")
        const shortImagePathReg = RegExp(shortImagePath)
        console.log(`=============== 开始查找${shortImagePath} ===============`)
        let size = 0;
        for (let file of resources.noImages) {
            size++;
            if (searchImage(file, shortImagePathReg)) {
                useImageFile.push(imagePath)
                break
            }
        }
        console.log(`=============== 共搜索文件${size} ===============`)
        console.log(`=============== 结束查找${shortImagePath} ===============`)
    }
    fs.writeFileSync(`${absDir}/useImageFile.json`, JSON.stringify(useImageFile, null, 4));
    let unUseImageFile = []
    for (let imagePath of resources.images) {
        if (!useImageFile.includes(imagePath)) {
            unUseImageFile.push(imagePath)
        }
    }
    fs.writeFileSync(`${absDir}/unUseImageFile.json`, JSON.stringify(unUseImageFile, null, 4));
    let message = `
    =========================================================
    项目<<${config.projectName}>>检测结果
    共查询到图片资源类型文件为${resources.images.length}
    共查询到非图片资源类型文件为${resources.noImages.length}
    其中检测到被使用的图片个数为${useImageFile.length}
    其中检测到未被使用的图片个数为${unUseImageFile.length}
    共用时：${(Date.now() - startTime) / 1000}s
    =========================================================
    `
    console.log(message)
    fs.writeFileSync(`${absDir}/output.txt`, message);
}

function searchImage(file, shortImagePathReg) {
    const content = fs.readFileSync(file).toString();
    return shortImagePathReg.test(content)
}

function getResource() {
    let resources = {
        images: [],
        noImages: []
    };
    for (let item of config.dirs) {
        console.log(`开始分类目录${item}下的资源`)
        Object.assign(resources, getFiles(item))
    }
    console.log(`共获取到图片文件个数为${resources.images.length}, 非图片文件个数${resources.noImages.length}`)
    fs.writeFileSync(`${absDir}/resource.json`, JSON.stringify(resources, null, 4));
    findImage(resources);
}
let startTime = Date.now();
generateDir();
getResource();
