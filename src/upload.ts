import expres, { response } from "express"
import busboy from "busboy"
import fs from "fs"
import path from "path";
import { io } from ".";

export const UploadRouter = expres.Router();


UploadRouter.put("/", (request, response) => {
    if (!request.headers['content-type']?.includes('multipart/form-data')) {
        response.status(400).json({ message: 'Invalid content type' });
        return;
    }
    const pid:string = request.headers["pid"]?.toString() || ""

    const totalFileSize = parseInt(request.headers['content-length'] || '0', 10);
    if (totalFileSize === 0) {
        response.status(400).send('File size is zero or content-length header is missing.');
        return;
    }

    const bb = busboy({ headers: request.headers });
    let uploadedSize = 0;
    let validFilename = '';

    bb.on('file', (fieldname, file, info) => {
        const { filename, encoding, mimeType } = info;
        validFilename =  Date.now() + path.extname(filename);
        console.log(`File [${fieldname}] received: ${filename}, encoding: ${encoding}, mimeType: ${mimeType}`);
        const saveTo = `./public/uploads/${validFilename}`;
        fs.mkdirSync(path.dirname(saveTo), { recursive: true });
        const writeStream = fs.createWriteStream(saveTo);
        file.pipe(writeStream);

        file.on('data', (data) => {
            uploadedSize += data.length;
            const progress = Math.round((uploadedSize / totalFileSize) * 100);
            io.emit('progress',{pid : pid, progress})
            console.log(progress + "%")
        });

        file.on('end', () => {
            console.log(`File [${validFilename}] finished`);
        });
    });

    bb.on('finish', () => {
        console.log('🎉 Upload complete!');
        response.status(200).send({ message: 'File uploaded successfully!', public_url: `${process.env.APP_URL}/uploads/${validFilename}` });
    });

    bb.on('error', (err) => {
        console.error('Error parsing form:', err);
        response.status(500).send('An error occurred during upload.');
    });

    request.pipe(bb);
})