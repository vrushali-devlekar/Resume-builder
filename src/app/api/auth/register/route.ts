import { connectDB } from "@/lib/mongodb";
import { generateJwt } from "@/lib/jwt";
import UserModel from "@/models/User.model";
import { ApiResponse } from "@/types/api.types";
import { RegisterBody } from "@/types/user.types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body: RegisterBody = await req.json();

    const { name, email, mobile, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "All fields are required",
        },
        {
          status: 400,
        }
      );
    }

    const isExisted = await UserModel.findOne({ email });

    if (isExisted) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "User already exists",
        },
        {
          status: 409,
        }
      );
    }

    const newUser = await UserModel.create({
      name,
      email,
      password,
      mobile,
    });

    const token = generateJwt({ userId: newUser._id.toString() });

    const response = NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "User created successfully",
        data: {
          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            mobile: newUser.mobile,
          },
          token,
        },
      },
      {
        status: 201,
      }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60,
    });

    return response;
  } catch (error) {
    console.log("error in register api", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Failed to create user",
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}
