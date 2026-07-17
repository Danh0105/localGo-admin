import { CloseOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import { Alert, Button, Image, Progress, Space, Typography } from 'antd';
import type { ChangeEvent, JSX } from 'react';
import { useRef, useState } from 'react';
import { uploadMedia } from '../../../api/media';
import { ApiError } from '../../../types/api';

interface ImageUploadFieldProps {
  label: string;
  imageUrl?: string;
  alt: string;
  hint?: string;
  disabled?: boolean;
  errorMessage?: string;
  errorId?: string;
  onUploaded: (result: { mediaId: string; imageUrl: string }) => void;
  onRemove: () => void;
}

export function ImageUploadField({
  label,
  imageUrl,
  alt,
  hint,
  disabled,
  errorMessage,
  errorId,
  onUploaded,
  onRemove,
}: ImageUploadFieldProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  async function upload(file: File): Promise<void> {
    setPendingFile(file);
    setUploadError(null);
    setProgress(0);
    try {
      const result = await uploadMedia(file, setProgress);
      onUploaded({ mediaId: result.id, imageUrl: result.url });
      setPendingFile(null);
    } catch (error) {
      setUploadError(error instanceof ApiError ? error.message : 'Tải ảnh lên thất bại, vui lòng thử lại');
    } finally {
      setProgress(null);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void upload(file);
  }

  const isUploading = progress !== null;
  const lowerLabel = label.toLowerCase();

  return (
    <div className="about-image-upload">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFileChange}
        disabled={disabled}
        aria-label={`Chọn tệp ${lowerLabel}`}
      />
      <div className="about-image-upload__preview">
        {imageUrl ? (
          <Image src={imageUrl} alt={alt} width={160} height={100} style={{ objectFit: 'cover' }} />
        ) : (
          <div className="about-image-upload__placeholder">Chưa có ảnh</div>
        )}
      </div>
      <Space orientation="vertical" size={4} style={{ flex: 1, minWidth: 200 }}>
        <Space wrap>
          <Button
            size="small"
            htmlType="button"
            icon={<UploadOutlined />}
            disabled={disabled || isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {imageUrl ? `Đổi ${lowerLabel}` : `Tải ${lowerLabel}`}
          </Button>
          {imageUrl && !isUploading && (
            <Button
              size="small"
              htmlType="button"
              danger
              icon={<CloseOutlined />}
              disabled={disabled}
              onClick={onRemove}
              aria-label={`Xóa ${lowerLabel}`}
            />
          )}
          {uploadError && pendingFile && (
            <Button
              size="small"
              htmlType="button"
              icon={<ReloadOutlined />}
              onClick={() => void upload(pendingFile)}
            >
              Thử lại
            </Button>
          )}
        </Space>
        {isUploading && <Progress percent={progress ?? 0} size="small" />}
        {uploadError && <Alert type="error" showIcon message={uploadError} />}
        {hint && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {hint}
          </Typography.Text>
        )}
        {errorMessage && (
          <Typography.Text type="danger" id={errorId} style={{ fontSize: 12 }}>
            {errorMessage}
          </Typography.Text>
        )}
      </Space>
    </div>
  );
}
