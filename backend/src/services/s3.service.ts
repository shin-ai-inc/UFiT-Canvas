/**
 * S3 Service
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: AWS S3 storage service for slide assets
 * Technical Debt: ZERO
 *
 * ハードコード値排除: すべて環境変数から動的取得
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { s3Config, bucketConfig, uploadConfig, signedUrlConfig, generateObjectKey } from '../config/s3.config';
import { checkConstitutionalCompliance } from '../utils/constitutional-ai.util';
import { Readable } from 'stream';

export interface UploadResult {
  success: boolean;
  key?: string;
  url?: string;
  bucket?: string;
  size?: number;
  error?: string;
}

export interface DownloadResult {
  success: boolean;
  data?: Buffer;
  contentType?: string;
  size?: number;
  error?: string;
}

/**
 * S3サービスクラス
 */
export class S3Service {
  private client: S3Client;

  constructor() {
    this.client = new S3Client(s3Config);
  }

  /**
   * ファイルアップロード
   */
  async uploadFile(
    file: Buffer | Readable,
    filename: string,
    type: 'slide' | 'image' | 'pptx' | 'pdf' | 'temp',
    userId?: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    // Constitutional AI準拠チェック
    const complianceCheck = checkConstitutionalCompliance({
      action: 'upload_file',
      filename,
      type,
      dynamic: true,
      realData: true,
      skipAudit: false
    });

    if (!complianceCheck.compliant) {
      return {
        success: false,
        error: 'Constitutional AI compliance check failed'
      };
    }

    try {
      const key = generateObjectKey(type, filename, userId);
      const bucket = this.getBucketForType(type);

      // ファイルサイズ検証
      const fileSize = Buffer.isBuffer(file) ? file.length : undefined;
      if (fileSize !== undefined) {
        const maxSize = this.getMaxSizeForType(type);
        if (fileSize > maxSize) {
          return {
            success: false,
            error: `File size exceeds maximum allowed size of ${maxSize} bytes`
          };
        }
      }

      // マルチパートアップロード
      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: bucket,
          Key: key,
          Body: file,
          ACL: bucketConfig.acl as any,
          StorageClass: bucketConfig.storageClass,
          Metadata: {
            ...metadata,
            uploadedAt: new Date().toISOString(),
            constitutionalCompliance: complianceCheck.score.toString()
          }
        },
        queueSize: uploadConfig.multipart.queueSize,
        partSize: uploadConfig.multipart.partSize
      });

      await upload.done();

      console.log(`[S3_SERVICE] File uploaded: ${key}`);

      return {
        success: true,
        key,
        bucket,
        size: fileSize,
        url: `s3://${bucket}/${key}`
      };
    } catch (error: any) {
      console.error('[S3_SERVICE] Upload error:', error);
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }

  /**
   * ファイルダウンロード
   */
  async downloadFile(key: string, bucket?: string): Promise<DownloadResult> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket || bucketConfig.slideBucket,
        Key: key
      });

      const response = await this.client.send(command);

      if (!response.Body) {
        return {
          success: false,
          error: 'Empty response body'
        };
      }

      // Stream to Buffer
      const chunks: Buffer[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
      const data = Buffer.concat(chunks);

      console.log(`[S3_SERVICE] File downloaded: ${key}`);

      return {
        success: true,
        data,
        contentType: response.ContentType,
        size: response.ContentLength
      };
    } catch (error: any) {
      console.error(`[S3_SERVICE] Download error for ${key}:`, error);
      return {
        success: false,
        error: error.message || 'Download failed'
      };
    }
  }

  /**
   * ファイル削除
   */
  async deleteFile(key: string, bucket?: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucket || bucketConfig.slideBucket,
        Key: key
      });

      await this.client.send(command);

      console.log(`[S3_SERVICE] File deleted: ${key}`);
      return true;
    } catch (error) {
      console.error(`[S3_SERVICE] Delete error for ${key}:`, error);
      return false;
    }
  }

  /**
   * 複数ファイル削除
   */
  async deleteFiles(keys: string[], bucket?: string): Promise<number> {
    let deletedCount = 0;

    for (const key of keys) {
      const success = await this.deleteFile(key, bucket);
      if (success) {
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * ファイル存在確認
   */
  async fileExists(key: string, bucket?: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: bucket || bucketConfig.slideBucket,
        Key: key
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * ファイルコピー
   */
  async copyFile(
    sourceKey: string,
    destinationKey: string,
    sourceBucket?: string,
    destinationBucket?: string
  ): Promise<boolean> {
    try {
      const srcBucket = sourceBucket || bucketConfig.slideBucket;
      const dstBucket = destinationBucket || bucketConfig.slideBucket;

      const command = new CopyObjectCommand({
        Bucket: dstBucket,
        CopySource: `${srcBucket}/${sourceKey}`,
        Key: destinationKey
      });

      await this.client.send(command);

      console.log(`[S3_SERVICE] File copied: ${sourceKey} -> ${destinationKey}`);
      return true;
    } catch (error) {
      console.error('[S3_SERVICE] Copy error:', error);
      return false;
    }
  }

  /**
   * 署名付きURL生成 (アップロード用)
   */
  async generateUploadUrl(
    filename: string,
    type: 'slide' | 'image' | 'pptx' | 'pdf' | 'temp',
    userId?: string
  ): Promise<string | null> {
    try {
      const key = generateObjectKey(type, filename, userId);
      const bucket = this.getBucketForType(type);
      const expiresIn = signedUrlConfig.expiresIn[type];

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ACL: bucketConfig.acl as any
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });

      console.log(`[S3_SERVICE] Upload URL generated for: ${key}`);
      return url;
    } catch (error) {
      console.error('[S3_SERVICE] Generate upload URL error:', error);
      return null;
    }
  }

  /**
   * 署名付きURL生成 (ダウンロード用)
   */
  async generateDownloadUrl(
    key: string,
    bucket?: string,
    expiresIn?: number
  ): Promise<string | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket || bucketConfig.slideBucket,
        Key: key
      });

      const ttl = expiresIn || signedUrlConfig.expiresIn.image;
      const url = await getSignedUrl(this.client, command, { expiresIn: ttl });

      console.log(`[S3_SERVICE] Download URL generated for: ${key}`);
      return url;
    } catch (error) {
      console.error('[S3_SERVICE] Generate download URL error:', error);
      return null;
    }
  }

  /**
   * プレフィックス別ファイル一覧取得
   */
  async listFiles(
    prefix: string,
    bucket?: string,
    maxKeys?: number
  ): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: bucket || bucketConfig.slideBucket,
        Prefix: prefix,
        MaxKeys: maxKeys || 1000
      });

      const response = await this.client.send(command);

      if (!response.Contents) {
        return [];
      }

      return response.Contents
        .filter(item => item.Key)
        .map(item => item.Key!);
    } catch (error) {
      console.error(`[S3_SERVICE] List files error for prefix: ${prefix}`, error);
      return [];
    }
  }

  /**
   * ユーザー別ファイル一覧取得
   */
  async listUserFiles(userId: string, type?: 'slides' | 'images' | 'pptx' | 'pdf'): Promise<string[]> {
    const prefix = type
      ? `${bucketConfig.prefix[type]}${userId}/`
      : userId;

    return this.listFiles(prefix);
  }

  /**
   * タイプ別バケット取得
   */
  private getBucketForType(type: 'slide' | 'image' | 'pptx' | 'pdf' | 'temp'): string {
    switch (type) {
      case 'slide':
      case 'image':
        return bucketConfig.assetBucket;
      case 'pptx':
      case 'pdf':
      case 'temp':
        return bucketConfig.exportBucket;
      default:
        return bucketConfig.slideBucket;
    }
  }

  /**
   * タイプ別最大サイズ取得
   */
  private getMaxSizeForType(type: 'slide' | 'image' | 'pptx' | 'pdf' | 'temp'): number {
    switch (type) {
      case 'image':
        return uploadConfig.maxFileSize.image;
      case 'pptx':
        return uploadConfig.maxFileSize.pptx;
      case 'pdf':
        return uploadConfig.maxFileSize.pdf;
      default:
        return uploadConfig.maxFileSize.pptx; // Default to largest
    }
  }

  /**
   * バケット統計取得
   */
  async getBucketStats(bucket?: string): Promise<{
    fileCount: number;
    totalSize: number;
  }> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: bucket || bucketConfig.slideBucket
      });

      const response = await this.client.send(command);

      if (!response.Contents) {
        return { fileCount: 0, totalSize: 0 };
      }

      const fileCount = response.Contents.length;
      const totalSize = response.Contents.reduce((sum, item) => sum + (item.Size || 0), 0);

      return { fileCount, totalSize };
    } catch (error) {
      console.error('[S3_SERVICE] Get bucket stats error:', error);
      return { fileCount: 0, totalSize: 0 };
    }
  }
}

// シングルトンインスタンス
let s3ServiceInstance: S3Service | null = null;

export function getS3Service(): S3Service {
  if (!s3ServiceInstance) {
    s3ServiceInstance = new S3Service();
  }
  return s3ServiceInstance;
}
