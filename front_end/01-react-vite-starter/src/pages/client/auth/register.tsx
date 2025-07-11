// import { loginAPI } from "@/services/api";
import { loginAPI } from "@/services/api";
import type { FormProps } from "antd";
import { Button, DatePicker, Divider, Form, Input, Select, Steps } from "antd";
import { useState } from "react";
import { Link } from "react-router-dom";
import "./register.scss";

type FieldTypeRegister = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  work: string;
  education: string;
  current_city: string;
  hometown: string;
  bio: string;
};

const RegisterPage = () => {
  const [isSubmit, setIsSubmit] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();

  const onFinish: FormProps<FieldTypeRegister>["onFinish"] = async (values) => {
    setIsSubmit(true);
    console.log("Form values:", values);
    // const res = await loginAPI("admin@gmail.com", "123456");
    console.log(">>> check url backend: ", import.meta.env.VITE_BACKEND_URL);
    const res = await loginAPI("adminhuy5@gmail.com", "123456");
    console.log(">>> check res: ", res);
    setIsSubmit(false);
  };

  const nextStep = () => {
    form.validateFields().then(() => {
      setCurrentStep(currentStep + 1);
    });
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const steps = [
    {
      title: "Thông tin cơ bản",
      content: (
        <>
          <Form.Item<FieldTypeRegister>
            labelCol={{ span: 24 }}
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email không được để trống!" },
              { type: "email", message: "Email không đúng định dạng!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldTypeRegister>
            labelCol={{ span: 24 }}
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: "Mật khẩu không được để trống!" },
              { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item<FieldTypeRegister>
            labelCol={{ span: 24 }}
            label="Họ"
            name="firstName"
            rules={[{ required: true, message: "Họ không được để trống!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldTypeRegister>
            labelCol={{ span: 24 }}
            label="Tên"
            name="lastName"
            rules={[{ required: true, message: "Tên không được để trống!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldTypeRegister>
            labelCol={{ span: 24 }}
            label="Ngày sinh"
            name="dateOfBirth"
            rules={[
              { required: true, message: "Ngày sinh không được để trống!" },
            ]}
          >
            <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
          </Form.Item>
        </>
      ),
    },
    {
      title: "Thông tin chi tiết",
      content: (
        <>
          <Form.Item<FieldTypeRegister>
            labelCol={{ span: 24 }}
            label="Giới tính"
            name="gender"
            rules={[
              { required: true, message: "Giới tính không được để trống!" },
            ]}
          >
            <Select>
              <Select.Option value="MALE">Nam</Select.Option>
              <Select.Option value="FEMALE">Nữ</Select.Option>
              <Select.Option value="OTHER">Khác</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item<FieldTypeRegister>
            labelCol={{ span: 24 }}
            label="Công việc"
            name="work"
            rules={[
              { required: true, message: "Công việc không được để trống!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldTypeRegister>
            labelCol={{ span: 24 }}
            label="Học vấn"
            name="education"
            rules={[
              { required: true, message: "Học vấn không được để trống!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldTypeRegister>
            labelCol={{ span: 24 }}
            label="Thành phố hiện tại"
            name="current_city"
            rules={[
              {
                required: true,
                message: "Thành phố hiện tại không được để trống!",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldTypeRegister>
            labelCol={{ span: 24 }}
            label="Quê quán"
            name="hometown"
            rules={[
              { required: true, message: "Quê quán không được để trống!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldTypeRegister>
            labelCol={{ span: 24 }}
            label="Giới thiệu"
            name="bio"
            rules={[
              { required: true, message: "Giới thiệu không được để trống!" },
            ]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </>
      ),
    },
  ];

  return (
    <div className="register-page">
      <main className="main">
        <div className="container">
          <section className="wrapper">
            <div className="heading" style={{ textAlign: "center" }}>
              <h2 className="text text-large" style={{ marginBottom: "20px" }}>
                Đăng Ký Tài Khoản
              </h2>
              <div>
                <img
                  style={{ width: "30px", height: "30px" }}
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/1024px-Facebook_Logo_%282019%29.png"
                  alt=""
                />
              </div>
              <span className="text text-normal" style={{ color: "#606770" }}>
                Nhanh chóng và dễ dàng.
              </span>
              <Divider />
            </div>

            <Steps
              current={currentStep}
              items={steps}
              style={{ marginBottom: 24 }}
            />

            <Form
              form={form}
              name="form-register"
              onFinish={onFinish}
              autoComplete="off"
              layout="vertical"
            >
              {steps[currentStep].content}

              <Form.Item>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  {currentStep > 0 && (
                    <Button onClick={prevStep}>Quay lại</Button>
                  )}

                  {currentStep < steps.length - 1 && (
                    <Button type="primary" onClick={nextStep}>
                      Tiếp theo
                    </Button>
                  )}

                  {currentStep === steps.length - 1 && (
                    <Button type="primary" htmlType="submit" loading={isSubmit}>
                      Đăng ký
                    </Button>
                  )}
                </div>
              </Form.Item>

              <Divider>Or</Divider>
              <p className="text text-normal" style={{ textAlign: "center" }}>
                Đã có tài khoản ?
                <span>
                  <Link to="/login"> Đăng Nhập </Link>
                </span>
              </p>
            </Form>
          </section>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;
