function readMarkdownFile(fileBuffer) {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('File is empty');
  }

  const content = fileBuffer.toString('utf-8').trim();

  if (!content) {
    throw new Error('File contains no readable text content');
  }

  return content;
}

module.exports = { readMarkdownFile };