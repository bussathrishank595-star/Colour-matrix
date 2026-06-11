// Set JWT as HTTP-only cookie and return response
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = user.getJWTToken();

  const cookieOptions = {
    expires: new Date(Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRE) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  };

  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    avatar: user.avatar,
    createdAt: user.createdAt,
  };

  res.status(statusCode).cookie('token', token, cookieOptions).json({
    success: true,
    message,
    token,
    user: userResponse,
  });
};

module.exports = sendTokenResponse;
