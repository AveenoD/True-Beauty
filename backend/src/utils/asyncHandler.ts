type AsyncHandler = (
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) => Promise<unknown> | unknown;

export const asyncHandler = (fn: AsyncHandler) => {
  return (
    req: import("express").Request,
    res: import("express").Response,
    next: import("express").NextFunction
  ) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
