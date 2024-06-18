import { DeleteObjectCommandOutput, S3 } from "@aws-sdk/client-s3";
import https from "https";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { randomUUID } from "crypto";
import { Upload } from "@aws-sdk/lib-storage";
import { DeleteObjectCommand } from "@aws-sdk/client-s3"; // ES Modules import

// const { Upload } = require("@aws-sdk/lib-storage");

interface AWSBucketRef {
  $metadata: {
    httpStatusCode: number;
    requestId: string;
    extendedRequestId: string;
    cfId: any;
    attempts: number;
    totalRetryDelay: number;
  };
  ETag: string;
  ServerSideEncryption: string;
  Bucket: string;
  Key: string;
  Location: string;
}

const { AWS_BUCKET_REGION, BUCKET_ACESS_KEY, BUCKET_SECRET_KEY, S3_BUCKET } =
  process.env;
// console.log({ AWS_BUCKET_REGION, BUCKET_ACESS_KEY, BUCKET_SECRET_KEY });

const s3_client_params = {
  // endpoint: 'https://s3.amazonaws.com', remove this as per suggestions from last section
  region: process.env?.AWS_BUCKET_REGION || "",
  credentials: {
    accessKeyId: process.env?.BUCKET_ACESS_KEY || "",
    secretAccessKey: process.env?.BUCKET_SECRET_KEY || "",
  },
  forcePathStyle: true,
  // signatureVersion: 'v4',   you can remove this as JS SDK v3 uses sigv4 as a standard.
  requestHandler: new NodeHttpHandler({
    httpsAgent: new https.Agent({
      keepAlive: true,
      rejectUnauthorized: false,
    }),
  }),
};

export const s3 = new S3(s3_client_params);

async function listBucketsForAccount() {
  try {
    const res = await s3.listBuckets({});
    console.log("res", res);
    console.log("SUCCESS check_list_buckets");
  } catch (err) {
    console.error("FAIL check_list_buckets got error", err);
  }
}

export const uploadAWS = async (file: {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: any;
}): Promise<AWSBucketRef | any> => {
  try {
    const parallelUploads3 = new Upload({
      client: s3,
      // queueSize: 4, // optional concurrency configuration
      leavePartsOnError: false, // optional manually handle dropped parts
      params: {
        Bucket: S3_BUCKET,
        Key: `${Date.now().toString()}-${randomUUID()}-${file.originalname}`,
        Body: file.buffer,
        ACL: "public-read",
        ContentType: file.mimetype,
      },
    });

    parallelUploads3.on("httpUploadProgress", progress => {
      console.log(progress);
    });

    const result = await parallelUploads3.done();

    return result;
  } catch (err) {
    return JSON.stringify(err);
  }
};

const getFileFromUrlKey = (url: string) => {
  return url?.split("?")[0].split("/").pop();
};

export const deleteFromAWS = async (
  fileUrl: string,
): Promise<DeleteObjectCommandOutput> => {
  const fileName = getFileFromUrlKey(fileUrl);

  console.log({ fileName });

  const client = s3;
  const input = {
    Bucket: S3_BUCKET,
    Key: fileName,
  };
  const command = new DeleteObjectCommand(input);
  const response = await client.send(command);

  return response;
};

//       maxFileSize: 100 * 1024 * 1024, //100 MBs converted to bytes,
//       allowEmptyFiles: false,
//     };

//     const form = formidable(options);

//     form.parse(req, (err, fields, files) => {});

//     form.on("error", error => {
//       reject(error.message);
//     });

//     form.on("data", data => {
//       if (data.name === "successUpload") {
//         resolve(data.value);
//       }
//     });

//     form.on("fileBegin", (formName, file) => {
//       file.open = async function () {
//         this._writeStream = new SVGTransform({
//           transform(chunk, encoding, callback) {
//             callback(null, chunk);
//           },
//         });

//         this._writeStream.on("error", e => {
//           form.emit("error", e);
//         });

//         // upload to S3
//         new Upload({
//           client: new S3Client({
//             credentials: {
//               accessKeyId,
//               secretAccessKey,
//             },
//             region,
//           }),
//           params: {
//             ACL: "public-read",
//             Bucket,
//             Key: `${Date.now().toString()}-${this.originalFilename}`,
//             Body: this._writeStream,
//           },
//           tags: [], // optional tags
//           queueSize: 4, // optional concurrency configuration
//           partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
//           leavePartsOnError: false, // optional manually handle dropped parts
//         })
//           .done()
//           .then(data => {
//             form.emit("data", { name: "complete", value: data });
//           })
//           .catch(err => {
//             form.emit("error", err);
//           });
//       };

//       file.end = function (cb) {
//         this._writeStream.on("finish", () => {
//           this.emit("end");
//           cb();
//         });
//         this._writeStream.end();
//       };
//     });
//   });
// };

// listBucketsForAccount();
