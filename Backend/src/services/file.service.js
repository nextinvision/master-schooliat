import config from "../config.js";
import prisma from "../prisma/client.js";

const getFileById = async (fileId) => {
  return await prisma.file.findUnique({
    where: { id: fileId },
  });
};

const attachFileURL = (file) => {
  if (config.FILE_STORAGE === "aws-s3") {
    file["url"] =
      `https://${config.AWS_S3_BUCKET}.s3.${config.AWS_REGION}.amazonaws.com/${config.FILE_PATH}/${file.id}.${file.extension}`;
  } else {
    file["url"] = `${config.API_URL}/files/${file.id}`;
  }

  return file;
};

const getFilesByIds = async (fileIds) => {
  if (!fileIds || fileIds.length === 0) return [];
  const files = await prisma.file.findMany({
    where: { id: { in: fileIds } },
  });
  return files.map((file) => attachFileURL(file));
};

const fileService = {
  getFileById,
  attachFileURL,
  getFilesByIds,
};

export default fileService;
