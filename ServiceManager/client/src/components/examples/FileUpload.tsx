import FileUpload from '../FileUpload';

export default function FileUploadExample() {
  return (
    <div className="max-w-2xl">
      <FileUpload
        onChange={(files) => console.log('Files selected:', files)}
      />
    </div>
  );
}
