import { getVoicesAPI, synthesizeSpeechAPI, type TTSRequest, type Voice } from "@/api/tts.api";
import { PauseCircleOutlined, PlayCircleOutlined, SoundOutlined } from "@ant-design/icons";
import { Button, Card, Checkbox, Form, Input, message, Select, Slider, Space, Spin } from "antd";
import { useEffect, useRef, useState } from "react";
import "./tts.scss";

const { TextArea } = Input;
const { Option } = Select;

const TTSPage = () => {
  const [form] = Form.useForm();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudioInfo, setCurrentAudioInfo] = useState<{
    text: string;
    voice: string;
    format: number;
  } | null>(null);

  // Lấy danh sách giọng đọc khi component mount
  useEffect(() => {
    fetchVoices();
  }, []);

  // Update audio src khi audioUrl thay đổi
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
    }
  }, [audioUrl]);

  // Cleanup audio khi component unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, [audioUrl]);

  const fetchVoices = async () => {
    try {
      setLoadingVoices(true);
      const response = await getVoicesAPI();
      
      if (response?.data?.voices) {
        setVoices(response.data.voices);
        
        // Set default voice là Diễm My (miền Nam)
        const defaultVoice = response.data.voices.find((v) => v.code === "hcm-diemmy");
        if (defaultVoice) {
          form.setFieldsValue({ voice: defaultVoice.code });
        }
      }
    } catch (error: any) {
      message.error("Không thể tải danh sách giọng đọc: " + (error?.message || "Lỗi không xác định"));
    } finally {
      setLoadingVoices(false);
    }
  };

  const handleSynthesize = async (values: TTSRequest) => {
    try {
      setLoading(true);
      setIsPlaying(false);

      // Dọn dẹp audio cũ
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      setCurrentAudioInfo(null);

      // Gọi API
      const response = await synthesizeSpeechAPI({
        text: values.text,
        voice: values.voice,
        speed: values.speed || 1.0,
        ttsReturnOption: values.ttsReturnOption || 3,
        withoutFilter: values.withoutFilter || false,
      });

      // Kiểm tra response có phải là Blob không
      if (!(response instanceof Blob)) {
        console.error("Response không phải là Blob:", response);
        throw new Error("Response không phải là audio file hợp lệ");
      }

      // Kiểm tra size của blob
      if (response.size === 0) {
        throw new Error("Audio file rỗng");
      }

      console.log("Blob size:", response.size, "Type:", response.type);

      // Tạo URL từ blob
      const url = URL.createObjectURL(response);
      setAudioUrl(url);

      // Lưu thông tin audio để dùng cho tên file
      setCurrentAudioInfo({
        text: values.text,
        voice: values.voice,
        format: values.ttsReturnOption || 3,
      });

      message.success("Tạo audio thành công!");
    } catch (error: any) {
      message.error("Lỗi khi tạo audio: " + (error?.message || "Lỗi không xác định"));
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = async () => {
    if (!audioRef.current || !audioUrl) {
      message.warning("Chưa có audio để phát");
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        // Đảm bảo src được set
        if (!audioRef.current.src || audioRef.current.src !== audioUrl) {
          audioRef.current.src = audioUrl;
          await audioRef.current.load();
        }
        
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error: any) {
        console.error("Lỗi khi phát audio:", error);
        message.error("Không thể phát audio: " + (error?.message || "Lỗi không xác định"));
        setIsPlaying(false);
      }
    }
  };

  // Tạo tên file hợp lý
  const generateFileName = (): string => {
    if (!currentAudioInfo) {
      return `tts-audio.${form.getFieldValue("ttsReturnOption") === 2 ? "wav" : "mp3"}`;
    }

    // Lấy preview text (30 ký tự đầu, loại bỏ ký tự đặc biệt)
    const textPreview = currentAudioInfo.text
      .slice(0, 30)
      .replace(/[^a-zA-Z0-9\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/gi, "")
      .replace(/\s+/g, "-")
      .toLowerCase()
      .trim();

    // Lấy tên voice từ code (ví dụ: hcm-diemmy -> diemmy)
    const voiceName = currentAudioInfo.voice.split("-").pop() || "voice";

    // Tạo timestamp
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");

    // Format extension
    const ext = currentAudioInfo.format === 2 ? "wav" : "mp3";

    // Tên file: tts-{text-preview}-{voice}-{date}.{ext}
    return `tts-${textPreview}-${voiceName}-${timestamp}.${ext}`;
  };

  // Nhóm giọng theo vùng miền
  const voicesByLocation = {
    BAC: voices.filter((v) => v.location === "BAC"),
    NAM: voices.filter((v) => v.location === "NAM"),
    TRUNG: voices.filter((v) => v.location === "TRUNG"),
  };

  return (
    <div className="tts-page">
      <Card
        title={
          <Space>
            <SoundOutlined />
            <span>Text to Speech - Chuyển đổi văn bản thành giọng nói</span>
          </Space>
        }
        style={{ maxWidth: 800, margin: "20px auto" }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSynthesize}
          initialValues={{
            speed: 1.0,
            ttsReturnOption: 3,
            withoutFilter: false,
          }}
        >
          <Form.Item
            name="text"
            label="Nhập văn bản cần chuyển đổi"
            rules={[{ required: true, message: "Vui lòng nhập văn bản" }]}
          >
            <TextArea
              rows={4}
              placeholder="Nhập văn bản tiếng Việt cần chuyển đổi thành giọng nói..."
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Form.Item
            name="voice"
            label="Chọn giọng đọc"
            rules={[{ required: true, message: "Vui lòng chọn giọng đọc" }]}
          >
            {loadingVoices ? (
              <Spin />
            ) : (
              <Select 
                placeholder="Chọn giọng đọc" 
                showSearch 
                filterOption={(input, option) => {
                  const label = String(option?.label || option?.children || '');
                  return label.toLowerCase().includes(input.toLowerCase());
                }}
              >
                {voicesByLocation.BAC.length > 0 && (
                  <>
                    <Option value="" disabled key="bac-header">
                      === Miền Bắc ===
                    </Option>
                    {voicesByLocation.BAC.map((voice) => (
                      <Option key={voice.code} value={voice.code}>
                        {voice.name} - {voice.description}
                      </Option>
                    ))}
                  </>
                )}
                {voicesByLocation.NAM.length > 0 && (
                  <>
                    <Option value="" disabled key="nam-header">
                      === Miền Nam ===
                    </Option>
                    {voicesByLocation.NAM.map((voice) => (
                      <Option key={voice.code} value={voice.code}>
                        {voice.name} - {voice.description}
                      </Option>
                    ))}
                  </>
                )}
                {voicesByLocation.TRUNG.length > 0 && (
                  <>
                    <Option value="" disabled key="trung-header">
                      === Miền Trung ===
                    </Option>
                    {voicesByLocation.TRUNG.map((voice) => (
                      <Option key={voice.code} value={voice.code}>
                        {voice.name} - {voice.description}
                      </Option>
                    ))}
                  </>
                )}
              </Select>
            )}
          </Form.Item>

          <Form.Item name="speed" label="Tốc độ giọng nói">
            <Slider
              min={0.8}
              max={1.2}
              step={0.1}
              marks={{
                0.8: "Chậm",
                1.0: "Bình thường",
                1.2: "Nhanh",
              }}
            />
          </Form.Item>

          <Form.Item name="ttsReturnOption" label="Định dạng file">
            <Select>
              <Option value={2}>WAV</Option>
              <Option value={3}>MP3</Option>
            </Select>
          </Form.Item>

          <Form.Item name="withoutFilter" valuePropName="checked">
            <Checkbox>Không sử dụng filter (nhanh hơn, chất lượng thấp hơn)</Checkbox>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SoundOutlined />} block>
              Tạo Audio
            </Button>
          </Form.Item>
        </Form>

        {audioUrl && (
          <Card
            title="Audio đã tạo"
            style={{ marginTop: 20 }}
            extra={
              <Button
                type="primary"
                icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                onClick={handlePlayPause}
              >
                {isPlaying ? "Tạm dừng" : "Phát"}
              </Button>
            }
          >
            <audio
              ref={audioRef}
              src={audioUrl}
              controls
              style={{ width: "100%" }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
            <div style={{ marginTop: 10 }}>
              <a href={audioUrl} download={generateFileName()}>
                <Button>Tải xuống</Button>
              </a>
            </div>
          </Card>
        )}
      </Card>
    </div>
  );
};

export default TTSPage;
