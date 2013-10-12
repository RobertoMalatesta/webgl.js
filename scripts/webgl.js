/*/////////////////////////////////////////////////////////////////////////////
/// @summary Implements a set of routines for working with WebGL resources at a
/// low level, including basic low-level optimizations like preventing
/// redundant render state changes.
/// @author Russell Klenk (contact@russellklenk.com)
///////////////////////////////////////////////////////////////////////////80*/
var WebGL = (function (exports)
{
    /// @summary Duplicates of constants from the WebGL specification and
    /// various extension specifications. We duplicate these here so that a
    /// context is not required to assign them within resource proxy objects.
    const WebGLConstants = {
        DEPTH_BUFFER_BIT                              : 0x00000100,
        STENCIL_BUFFER_BIT                            : 0x00000400,
        COLOR_BUFFER_BIT                              : 0x00004000,
        POINTS                                        : 0x0000,
        LINES                                         : 0x0001,
        LINE_LOOP                                     : 0x0002,
        LINE_STRIP                                    : 0x0003,
        TRIANGLES                                     : 0x0004,
        TRIANGLE_STRIP                                : 0x0005,
        TRIANGLE_FAN                                  : 0x0006,
        ZERO                                          : 0,
        ONE                                           : 1,
        SRC_COLOR                                     : 0x0300,
        ONE_MINUS_SRC_COLOR                           : 0x0301,
        SRC_ALPHA                                     : 0x0302,
        ONE_MINUS_SRC_ALPHA                           : 0x0303,
        DST_ALPHA                                     : 0x0304,
        ONE_MINUS_DST_ALPHA                           : 0x0305,
        DST_COLOR                                     : 0x0306,
        ONE_MINUS_DST_COLOR                           : 0x0307,
        SRC_ALPHA_SATURATE                            : 0x0308,
        FUNC_ADD                                      : 0x8006,
        BLEND_EQUATION                                : 0x8009,
        BLEND_EQUATION_RGB                            : 0x8009,
        BLEND_EQUATION_ALPHA                          : 0x883D,
        FUNC_SUBTRACT                                 : 0x800A,
        FUNC_REVERSE_SUBTRACT                         : 0x800B,
        BLEND_DST_RGB                                 : 0x80C8,
        BLEND_SRC_RGB                                 : 0x80C9,
        BLEND_DST_ALPHA                               : 0x80CA,
        BLEND_SRC_ALPHA                               : 0x80CB,
        CONSTANT_COLOR                                : 0x8001,
        ONE_MINUS_CONSTANT_COLOR                      : 0x8002,
        CONSTANT_ALPHA                                : 0x8003,
        ONE_MINUS_CONSTANT_ALPHA                      : 0x8004,
        BLEND_COLOR                                   : 0x8005,
        ARRAY_BUFFER                                  : 0x8892,
        ELEMENT_ARRAY_BUFFER                          : 0x8893,
        ARRAY_BUFFER_BINDING                          : 0x8894,
        ELEMENT_ARRAY_BUFFER_BINDING                  : 0x8895,
        STREAM_DRAW                                   : 0x88E0,
        STATIC_DRAW                                   : 0x88E4,
        DYNAMIC_DRAW                                  : 0x88E8,
        BUFFER_SIZE                                   : 0x8764,
        BUFFER_USAGE                                  : 0x8765,
        CURRENT_VERTEX_ATTRIB                         : 0x8626,
        FRONT                                         : 0x0404,
        BACK                                          : 0x0405,
        FRONT_AND_BACK                                : 0x0408,
        CULL_FACE                                     : 0x0B44,
        BLEND                                         : 0x0BE2,
        DITHER                                        : 0x0BD0,
        STENCIL_TEST                                  : 0x0B90,
        DEPTH_TEST                                    : 0x0B71,
        SCISSOR_TEST                                  : 0x0C11,
        POLYGON_OFFSET_FILL                           : 0x8037,
        SAMPLE_ALPHA_TO_COVERAGE                      : 0x809E,
        SAMPLE_COVERAGE                               : 0x80A0,
        NO_ERROR                                      : 0,
        INVALID_ENUM                                  : 0x0500,
        INVALID_VALUE                                 : 0x0501,
        INVALID_OPERATION                             : 0x0502,
        OUT_OF_MEMORY                                 : 0x0505,
        CW                                            : 0x0900,
        CCW                                           : 0x0901,
        LINE_WIDTH                                    : 0x0B21,
        ALIASED_POINT_SIZE_RANGE                      : 0x846D,
        ALIASED_LINE_WIDTH_RANGE                      : 0x846E,
        CULL_FACE_MODE                                : 0x0B45,
        FRONT_FACE                                    : 0x0B46,
        DEPTH_RANGE                                   : 0x0B70,
        DEPTH_WRITEMASK                               : 0x0B72,
        DEPTH_CLEAR_VALUE                             : 0x0B73,
        DEPTH_FUNC                                    : 0x0B74,
        STENCIL_CLEAR_VALUE                           : 0x0B91,
        STENCIL_FUNC                                  : 0x0B92,
        STENCIL_FAIL                                  : 0x0B94,
        STENCIL_PASS_DEPTH_FAIL                       : 0x0B95,
        STENCIL_PASS_DEPTH_PASS                       : 0x0B96,
        STENCIL_REF                                   : 0x0B97,
        STENCIL_VALUE_MASK                            : 0x0B93,
        STENCIL_WRITEMASK                             : 0x0B98,
        STENCIL_BACK_FUNC                             : 0x8800,
        STENCIL_BACK_FAIL                             : 0x8801,
        STENCIL_BACK_PASS_DEPTH_FAIL                  : 0x8802,
        STENCIL_BACK_PASS_DEPTH_PASS                  : 0x8803,
        STENCIL_BACK_REF                              : 0x8CA3,
        STENCIL_BACK_VALUE_MASK                       : 0x8CA4,
        STENCIL_BACK_WRITEMASK                        : 0x8CA5,
        VIEWPORT                                      : 0x0BA2,
        SCISSOR_BOX                                   : 0x0C10,
        COLOR_CLEAR_VALUE                             : 0x0C22,
        COLOR_WRITEMASK                               : 0x0C23,
        UNPACK_ALIGNMENT                              : 0x0CF5,
        PACK_ALIGNMENT                                : 0x0D05,
        MAX_TEXTURE_SIZE                              : 0x0D33,
        MAX_VIEWPORT_DIMS                             : 0x0D3A,
        SUBPIXEL_BITS                                 : 0x0D50,
        RED_BITS                                      : 0x0D52,
        GREEN_BITS                                    : 0x0D53,
        BLUE_BITS                                     : 0x0D54,
        ALPHA_BITS                                    : 0x0D55,
        DEPTH_BITS                                    : 0x0D56,
        STENCIL_BITS                                  : 0x0D57,
        POLYGON_OFFSET_UNITS                          : 0x2A00,
        POLYGON_OFFSET_FACTOR                         : 0x8038,
        TEXTURE_BINDING_2D                            : 0x8069,
        SAMPLE_BUFFERS                                : 0x80A8,
        SAMPLES                                       : 0x80A9,
        SAMPLE_COVERAGE_VALUE                         : 0x80AA,
        SAMPLE_COVERAGE_INVERT                        : 0x80AB,
        COMPRESSED_TEXTURE_FORMATS                    : 0x86A3,
        DONT_CARE                                     : 0x1100,
        FASTEST                                       : 0x1101,
        NICEST                                        : 0x1102,
        GENERATE_MIPMAP_HINT                          : 0x8192,
        BYTE                                          : 0x1400,
        UNSIGNED_BYTE                                 : 0x1401,
        SHORT                                         : 0x1402,
        UNSIGNED_SHORT                                : 0x1403,
        INT                                           : 0x1404,
        UNSIGNED_INT                                  : 0x1405,
        FLOAT                                         : 0x1406,
        DEPTH_COMPONENT                               : 0x1902,
        ALPHA                                         : 0x1906,
        RGB                                           : 0x1907,
        RGBA                                          : 0x1908,
        LUMINANCE                                     : 0x1909,
        LUMINANCE_ALPHA                               : 0x190A,
        UNSIGNED_SHORT_4_4_4_4                        : 0x8033,
        UNSIGNED_SHORT_5_5_5_1                        : 0x8034,
        UNSIGNED_SHORT_5_6_5                          : 0x8363,
        FRAGMENT_SHADER                               : 0x8B30,
        VERTEX_SHADER                                 : 0x8B31,
        MAX_VERTEX_ATTRIBS                            : 0x8869,
        MAX_VERTEX_UNIFORM_VECTORS                    : 0x8DFB,
        MAX_VARYING_VECTORS                           : 0x8DFC,
        MAX_COMBINED_TEXTURE_IMAGE_UNITS              : 0x8B4D,
        MAX_VERTEX_TEXTURE_IMAGE_UNITS                : 0x8B4C,
        MAX_TEXTURE_IMAGE_UNITS                       : 0x8872,
        MAX_FRAGMENT_UNIFORM_VECTORS                  : 0x8DFD,
        SHADER_TYPE                                   : 0x8B4F,
        DELETE_STATUS                                 : 0x8B80,
        LINK_STATUS                                   : 0x8B82,
        VALIDATE_STATUS                               : 0x8B83,
        ATTACHED_SHADERS                              : 0x8B85,
        ACTIVE_UNIFORMS                               : 0x8B86,
        ACTIVE_ATTRIBUTES                             : 0x8B89,
        SHADING_LANGUAGE_VERSION                      : 0x8B8C,
        CURRENT_PROGRAM                               : 0x8B8D,
        NEVER                                         : 0x0200,
        LESS                                          : 0x0201,
        EQUAL                                         : 0x0202,
        LEQUAL                                        : 0x0203,
        GREATER                                       : 0x0204,
        NOTEQUAL                                      : 0x0205,
        GEQUAL                                        : 0x0206,
        ALWAYS                                        : 0x0207,
        KEEP                                          : 0x1E00,
        REPLACE                                       : 0x1E01,
        INCR                                          : 0x1E02,
        DECR                                          : 0x1E03,
        INVERT                                        : 0x150A,
        INCR_WRAP                                     : 0x8507,
        DECR_WRAP                                     : 0x8508,
        VENDOR                                        : 0x1F00,
        RENDERER                                      : 0x1F01,
        VERSION                                       : 0x1F02,
        NEAREST                                       : 0x2600,
        LINEAR                                        : 0x2601,
        NEAREST_MIPMAP_NEAREST                        : 0x2700,
        LINEAR_MIPMAP_NEAREST                         : 0x2701,
        NEAREST_MIPMAP_LINEAR                         : 0x2702,
        LINEAR_MIPMAP_LINEAR                          : 0x2703,
        TEXTURE_MAG_FILTER                            : 0x2800,
        TEXTURE_MIN_FILTER                            : 0x2801,
        TEXTURE_WRAP_S                                : 0x2802,
        TEXTURE_WRAP_T                                : 0x2803,
        TEXTURE_2D                                    : 0x0DE1,
        TEXTURE                                       : 0x1702,
        TEXTURE_CUBE_MAP                              : 0x8513,
        TEXTURE_BINDING_CUBE_MAP                      : 0x8514,
        TEXTURE_CUBE_MAP_POSITIVE_X                   : 0x8515,
        TEXTURE_CUBE_MAP_NEGATIVE_X                   : 0x8516,
        TEXTURE_CUBE_MAP_POSITIVE_Y                   : 0x8517,
        TEXTURE_CUBE_MAP_NEGATIVE_Y                   : 0x8518,
        TEXTURE_CUBE_MAP_POSITIVE_Z                   : 0x8519,
        TEXTURE_CUBE_MAP_NEGATIVE_Z                   : 0x851A,
        MAX_CUBE_MAP_TEXTURE_SIZE                     : 0x851C,
        TEXTURE0                                      : 0x84C0,
        TEXTURE1                                      : 0x84C1,
        TEXTURE2                                      : 0x84C2,
        TEXTURE3                                      : 0x84C3,
        TEXTURE4                                      : 0x84C4,
        TEXTURE5                                      : 0x84C5,
        TEXTURE6                                      : 0x84C6,
        TEXTURE7                                      : 0x84C7,
        TEXTURE8                                      : 0x84C8,
        TEXTURE9                                      : 0x84C9,
        TEXTURE10                                     : 0x84CA,
        TEXTURE11                                     : 0x84CB,
        TEXTURE12                                     : 0x84CC,
        TEXTURE13                                     : 0x84CD,
        TEXTURE14                                     : 0x84CE,
        TEXTURE15                                     : 0x84CF,
        TEXTURE16                                     : 0x84D0,
        TEXTURE17                                     : 0x84D1,
        TEXTURE18                                     : 0x84D2,
        TEXTURE19                                     : 0x84D3,
        TEXTURE20                                     : 0x84D4,
        TEXTURE21                                     : 0x84D5,
        TEXTURE22                                     : 0x84D6,
        TEXTURE23                                     : 0x84D7,
        TEXTURE24                                     : 0x84D8,
        TEXTURE25                                     : 0x84D9,
        TEXTURE26                                     : 0x84DA,
        TEXTURE27                                     : 0x84DB,
        TEXTURE28                                     : 0x84DC,
        TEXTURE29                                     : 0x84DD,
        TEXTURE30                                     : 0x84DE,
        TEXTURE31                                     : 0x84DF,
        ACTIVE_TEXTURE                                : 0x84E0,
        REPEAT                                        : 0x2901,
        CLAMP_TO_EDGE                                 : 0x812F,
        MIRRORED_REPEAT                               : 0x8370,
        FLOAT_VEC2                                    : 0x8B50,
        FLOAT_VEC3                                    : 0x8B51,
        FLOAT_VEC4                                    : 0x8B52,
        INT_VEC2                                      : 0x8B53,
        INT_VEC3                                      : 0x8B54,
        INT_VEC4                                      : 0x8B55,
        BOOL                                          : 0x8B56,
        BOOL_VEC2                                     : 0x8B57,
        BOOL_VEC3                                     : 0x8B58,
        BOOL_VEC4                                     : 0x8B59,
        FLOAT_MAT2                                    : 0x8B5A,
        FLOAT_MAT3                                    : 0x8B5B,
        FLOAT_MAT4                                    : 0x8B5C,
        SAMPLER_2D                                    : 0x8B5E,
        SAMPLER_CUBE                                  : 0x8B60,
        VERTEX_ATTRIB_ARRAY_ENABLED                   : 0x8622,
        VERTEX_ATTRIB_ARRAY_SIZE                      : 0x8623,
        VERTEX_ATTRIB_ARRAY_STRIDE                    : 0x8624,
        VERTEX_ATTRIB_ARRAY_TYPE                      : 0x8625,
        VERTEX_ATTRIB_ARRAY_NORMALIZED                : 0x886A,
        VERTEX_ATTRIB_ARRAY_POINTER                   : 0x8645,
        VERTEX_ATTRIB_ARRAY_BUFFER_BINDING            : 0x889F,
        COMPILE_STATUS                                : 0x8B81,
        LOW_FLOAT                                     : 0x8DF0,
        MEDIUM_FLOAT                                  : 0x8DF1,
        HIGH_FLOAT                                    : 0x8DF2,
        LOW_INT                                       : 0x8DF3,
        MEDIUM_INT                                    : 0x8DF4,
        HIGH_INT                                      : 0x8DF5,
        FRAMEBUFFER                                   : 0x8D40,
        RENDERBUFFER                                  : 0x8D41,
        RGBA4                                         : 0x8056,
        RGB5_A1                                       : 0x8057,
        RGB565                                        : 0x8D62,
        DEPTH_COMPONENT16                             : 0x81A5,
        STENCIL_INDEX                                 : 0x1901,
        STENCIL_INDEX8                                : 0x8D48,
        DEPTH_STENCIL                                 : 0x84F9,
        RENDERBUFFER_WIDTH                            : 0x8D42,
        RENDERBUFFER_HEIGHT                           : 0x8D43,
        RENDERBUFFER_INTERNAL_FORMAT                  : 0x8D44,
        RENDERBUFFER_RED_SIZE                         : 0x8D50,
        RENDERBUFFER_GREEN_SIZE                       : 0x8D51,
        RENDERBUFFER_BLUE_SIZE                        : 0x8D52,
        RENDERBUFFER_ALPHA_SIZE                       : 0x8D53,
        RENDERBUFFER_DEPTH_SIZE                       : 0x8D54,
        RENDERBUFFER_STENCIL_SIZE                     : 0x8D55,
        FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE            : 0x8CD0,
        FRAMEBUFFER_ATTACHMENT_OBJECT_NAME            : 0x8CD1,
        FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL          : 0x8CD2,
        FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE  : 0x8CD3,
        COLOR_ATTACHMENT0                             : 0x8CE0,
        DEPTH_ATTACHMENT                              : 0x8D00,
        STENCIL_ATTACHMENT                            : 0x8D20,
        DEPTH_STENCIL_ATTACHMENT                      : 0x821A,
        NONE                                          : 0,
        FRAMEBUFFER_COMPLETE                          : 0x8CD5,
        FRAMEBUFFER_INCOMPLETE_ATTACHMENT             : 0x8CD6,
        FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT     : 0x8CD7,
        FRAMEBUFFER_INCOMPLETE_DIMENSIONS             : 0x8CD9,
        FRAMEBUFFER_UNSUPPORTED                       : 0x8CDD,
        FRAMEBUFFER_BINDING                           : 0x8CA6,
        RENDERBUFFER_BINDING                          : 0x8CA7,
        MAX_RENDERBUFFER_SIZE                         : 0x84E8,
        INVALID_FRAMEBUFFER_OPERATION                 : 0x0506,
        UNPACK_FLIP_Y_WEBGL                           : 0x9240,
        UNPACK_PREMULTIPLY_ALPHA_WEBGL                : 0x9241,
        CONTEXT_LOST_WEBGL                            : 0x9242,
        UNPACK_COLORSPACE_CONVERSION_WEBGL            : 0x9243,
        BROWSER_DEFAULT_WEBGL                         : 0x9244,
        /* OES_texture_half_float */
        HALF_FLOAT_OES                                : 0x8D61,
        /* OES_standard_derivatives */
        FRAGMENT_SHADER_DERIVATIVE_HINT_OES           : 0x8B8B,
        /* OES_vertex_array_object */
        VERTEX_ARRAY_BINDING_OES                      : 0x85B5,
        /* WEBGL_debug_renderer_info */
        UNMASKED_VENDOR_WEBGL                         : 0x9245,
        UNMASKED_RENDERER_WEBGL                       : 0x9246,
        /* WEBGL_compressed_texture_s3tc */
        COMPRESSED_RGB_S3TC_DXT1_EXT                  : 0x83F0,
        COMPRESSED_RGBA_S3TC_DXT1_EXT                 : 0x83F1,
        COMPRESSED_RGBA_S3TC_DXT3_EXT                 : 0x83F2,
        COMPRESSED_RGBA_S3TC_DXT5_EXT                 : 0x83F3,
        /* WEBGL_depth_texture */
        UNSIGNED_INT_24_8_WEBGL                       : 0x84FA,
        /* EXT_texture_filter_anisotropic */
        TEXTURE_MAX_ANISOTROPY_EXT                    : 0x84FE,
        MAX_TEXTURE_MAX_ANISOTROPY_EXT                : 0x84FF,
        /* WEBGL_compressed_texture_atc */
        COMPRESSED_RGB_ATC_WEBGL                      : 0x8C92,
        COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL      : 0x8C93,
        COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL  : 0x87EE,
        /* WEBGL_compressed_texture_pvrtc */
        COMPRESSED_RGB_PVRTC_4BPPV1_IMG               : 0x8C00,
        COMPRESSED_RGB_PVRTC_2BPPV1_IMG               : 0x8C01,
        COMPRESSED_RGBA_PVRTC_4BPPV1_IMG              : 0x8C02,
        COMPRESSED_RGBA_PVRTC_2BPPV1_IMG              : 0x8C03,
        /* EXT_color_buffer_half_float */
        RGBA16F_EXT                                   : 0x881A,
        RGB16F_EXT                                    : 0x881B,
        FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE_EXT     : 0x8211,
        UNSIGNED_NORMALIZED_EXT                       : 0x8C17,
        /* WEBGL_color_buffer_float */
        RGBA32F_EXT                                   : 0x8814,
        RGB32F_EXT                                    : 0x8815,
        /* EXT_sRGB */
        SRGB_EXT                                      : 0x8C40,
        SRGB_ALPHA_EXT                                : 0x8C42,
        SRGB8_ALPHA8_EXT                              : 0x8C43,
        FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT     : 0x8210,
        /* WEBGL_draw_buffers */
        COLOR_ATTACHMENT0_WEBGL                       : 0x8CE0,
        COLOR_ATTACHMENT1_WEBGL                       : 0x8CE1,
        COLOR_ATTACHMENT2_WEBGL                       : 0x8CE2,
        COLOR_ATTACHMENT3_WEBGL                       : 0x8CE3,
        COLOR_ATTACHMENT4_WEBGL                       : 0x8CE4,
        COLOR_ATTACHMENT5_WEBGL                       : 0x8CE5,
        COLOR_ATTACHMENT6_WEBGL                       : 0x8CE6,
        COLOR_ATTACHMENT7_WEBGL                       : 0x8CE7,
        COLOR_ATTACHMENT8_WEBGL                       : 0x8CE8,
        COLOR_ATTACHMENT9_WEBGL                       : 0x8CE9,
        COLOR_ATTACHMENT10_WEBGL                      : 0x8CEA,
        COLOR_ATTACHMENT11_WEBGL                      : 0x8CEB,
        COLOR_ATTACHMENT12_WEBGL                      : 0x8CEC,
        COLOR_ATTACHMENT13_WEBGL                      : 0x8CED,
        COLOR_ATTACHMENT14_WEBGL                      : 0x8CEE,
        COLOR_ATTACHMENT15_WEBGL                      : 0x8CEF,
        DRAW_BUFFER0_WEBGL                            : 0x8825,
        DRAW_BUFFER1_WEBGL                            : 0x8826,
        DRAW_BUFFER2_WEBGL                            : 0x8827,
        DRAW_BUFFER3_WEBGL                            : 0x8828,
        DRAW_BUFFER4_WEBGL                            : 0x8829,
        DRAW_BUFFER5_WEBGL                            : 0x882A,
        DRAW_BUFFER6_WEBGL                            : 0x882B,
        DRAW_BUFFER7_WEBGL                            : 0x882C,
        DRAW_BUFFER8_WEBGL                            : 0x882D,
        DRAW_BUFFER9_WEBGL                            : 0x882E,
        DRAW_BUFFER10_WEBGL                           : 0x882F,
        DRAW_BUFFER11_WEBGL                           : 0x8830,
        DRAW_BUFFER12_WEBGL                           : 0x8831,
        DRAW_BUFFER13_WEBGL                           : 0x8832,
        DRAW_BUFFER14_WEBGL                           : 0x8833,
        DRAW_BUFFER15_WEBGL                           : 0x8834,
        MAX_COLOR_ATTACHMENTS_WEBGL                   : 0x8CDF,
        MAX_DRAW_BUFFERS_WEBGL                        : 0x8824,
        /* ANGLE_instanced_arrays */
        VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE             : 0x88FE,
        /* WEBGL_shared_resources */
        READ_ONLY                                     : 0x0001,
        EXCLUSIVE                                     : 0x0004,
        READ_FRAMEBUFFER                              : 0x8CA8,
        DRAW_FRAMEBUFFER                              : 0x8CA9,
    };

    /// @summary A table used to quickly map an index size to the corresponding
    /// WebGL index type enumeration value.
    const IndexType         = [
        WebGLConstants.UNSIGNED_BYTE,
        WebGLConstants.UNSIGNED_BYTE,
        WebGLConstants.UNSIGNED_SHORT,
        WebGLConstants.UNSIGNED_INT,
        WebGLConstants.UNSIGNED_INT
    ];

    /// @summary An enumeration defining the various resource types. These
    /// values are used by the GraphicsContext to look up the resource list
    /// associate with a given resource.
    const ResourceType      = {
        UNKNOWN             : 0,  /// resource is invalid
        TEXTURE             : 1,  /// 2D texture or cube map
        DATA_BUFFER         : 2,  /// vertex, index etc. buffer
        FRAME_BUFFER        : 3,  /// offscreen render target
        RENDER_BUFFER       : 4,  /// depth or stencil buffer
        SHADER_PROGRAM      : 5,  /// GLSL shader program object
        STATE_OBJECT        : 6   /// an object storing a set of render states
    };

    /// @summary An enumeration defining the various resource sub-types. These
    /// values are used for informational purposes only.
    const ResourceSubType   = {
        UNKNOWN             : 0,  /// resource is invalid
        VERTEX_BUFFER       : 1,  /// a buffer for storing vertex data
        ELEMENT_BUFFER      : 2,  /// a buffer for storing index data
        INDEX_BUFFER        : 2,  /// alias for ELEMENT_BUFFER
        UNIFORM_BUFFER      : 3,  /// a buffer for storing uniform data
        GENERIC_BUFFER      : 4,  /// some other type of buffer
        TEXTURE_2D          : 5,  /// 2D texture object
        TEXTURE_CUBE        : 6,  /// cube map texture object
        TEXTURE_DEPTH       : 7,  /// WEBGL_depth_texture
        RENDER_TARGET       : 8,  /// offscreen target for blit operations
        PIXEL_BUFFER        : 9,  /// renderbuffer used for image processing
        DEPTH_BUFFER        : 10, /// renderbuffer used for storing depth
        STENCIL_BUFFER      : 11, /// renderbuffer used for stencil data
        DEPTH_STENCIL_BUFFER: 12, /// renderbuffer used for depth+stencil data
        GRAPHICS_SHADER     : 13, /// standard vertex+pixel shader program
        COMPUTE_SHADER      : 14, /// WebCL-style compute shader program
        BLEND_STATE         : 15, /// a group of states for alpha blending
        CLEAR_STATE         : 16, /// a group of states for framebuffer clearing
        DEPTH_STENCIL_STATE : 17, /// a group of states for depth/stencil test
        RASTER_STATE        : 18  /// a group of states for primitive raster
    };

    /// @summary An array whose elements consist of the names of all of the
    /// valid texture slots. WebGL 1.0 defines 32 texture slots.
    const TextureSlots      = [
        WebGLConstants.TEXTURE0,
        WebGLConstants.TEXTURE1,
        WebGLConstants.TEXTURE2,
        WebGLConstants.TEXTURE3,
        WebGLConstants.TEXTURE4,
        WebGLConstants.TEXTURE5,
        WebGLConstants.TEXTURE6,
        WebGLConstants.TEXTURE7,
        WebGLConstants.TEXTURE8,
        WebGLConstants.TEXTURE9,
        WebGLConstants.TEXTURE10,
        WebGLConstants.TEXTURE11,
        WebGLConstants.TEXTURE12,
        WebGLConstants.TEXTURE13,
        WebGLConstants.TEXTURE14,
        WebGLConstants.TEXTURE15,
        WebGLConstants.TEXTURE16,
        WebGLConstants.TEXTURE17,
        WebGLConstants.TEXTURE18,
        WebGLConstants.TEXTURE19,
        WebGLConstants.TEXTURE20,
        WebGLConstants.TEXTURE21,
        WebGLConstants.TEXTURE22,
        WebGLConstants.TEXTURE23,
        WebGLConstants.TEXTURE24,
        WebGLConstants.TEXTURE25,
        WebGLConstants.TEXTURE26,
        WebGLConstants.TEXTURE27,
        WebGLConstants.TEXTURE28,
        WebGLConstants.TEXTURE29,
        WebGLConstants.TEXTURE30,
        WebGLConstants.TEXTURE31
    ];

    /// @summary A table mapping a string GLSL data type name to its
    /// corresponding integer/enum value.
    var WebGLShaderDataTypes     = null;

    /// @summary A value indicating whether the string => enum table for the
    /// GLSL data types needs to be initialized. After initialization, this
    /// value is set to false.
    var WebGLShaderDataTypesInit = true;

    /// @summary A table mapping a value from ResourceType to the string
    /// corresponding to the property name.
    var WebGLBaseTypeStrings     = null;

    /// @summary A table mapping a value from ResourceSubType to the string
    /// corresponding to the property name.
    var WebGLSubTypeStrings      = null;

    /// @summary A table mapping a value from WebGLConstants to the string
    /// corresponding to its property name. The string is a raw, undecorated
    /// value that can be used as a key into WebGLContext or a WebGL context.
    var WebGLEnumStringsRaw      = null;

    /// @summary A table mapping a value from WebGLConstants to the string
    /// corresponding to its property name. The string is decorated such that
    /// the enum name is prefixed with 'GL_', and the hexadecimal numeric
    /// value is pre-pended.
    var WebGLEnumStringsPretty   = null;

    /// @summary A value indicating whether the enum => string tables need to
    /// be initialized. After initialization, this value is set to false.
    var WebGLEnumStringsInit     = true;

    /// @summary Initializes the WebGLShaderDataTypes table, if it has not
    /// already been initialized.
    function initGLSLTable()
    {
        if (WebGLShaderDataTypesInit)
        {
            WebGLShaderDataTypesInit = false;
            var type_names = [
                'float',  'vec2',  'vec3',  'vec4',
                'int'  , 'ivec2', 'ivec3', 'ivec4',
                'bool' , 'bvec2', 'bvec3', 'bvec4',
                'mat2' , 'mat3' ,  'mat4', 'sampler2D', 'samplerCube'
            ];
            var type_value = [
                WebGLConstants.FLOAT,
                WebGLConstants.FLOAT_VEC2,
                WebGLConstants.FLOAT_VEC3,
                WebGLConstants.FLOAT_VEC4,
                WebGLConstants.INT,
                WebGLConstants.INT_VEC2,
                WebGLConstants.INT_VEC3,
                WebGLConstants.INT_VEC4,
                WebGLConstants.BOOL,
                WebGLConstants.BOOL_VEC2,
                WebGLConstants.BOOL_VEC3,
                WebGLConstants.BOOL_VEC4,
                WebGLConstants.FLOAT_MAT2,
                WebGLConstants.FLOAT_MAT3,
                WebGLConstants.FLOAT_MAT4,
                WebGLConstants.SAMPLER_2D,
                WebGLConstants.SAMPLER_CUBE
            ];
            var table  = {};
            for (var i = 0, n = type_names.length; i < n; ++i)
            {
                table[type_names[i]] = type_value[i]
            }
            WebGLShaderDataTypes = table;
        }
    }

    /// @summary Initializes the WebGLEnumStringsRaw and WebGLEnumStringsPretty
    /// tables, if they have not already been initialized.
    function initEnumStrings()
    {
        if (WebGLEnumStringsInit)
        {
            WebGLEnumStringsInit = false;
            var table_raw  = {}
            var table_dec  = {}
            var enums      = WebGLConstants;
            for (var name in enums)
            {
                var value  = enums[name];
                var str    = 'GL_' + name;
                var hex    = '0x'  + value.toString(16);
                table_raw[value]   = name;
                table_dec[value]   = hex + ' ('+str+')';
            }
            WebGLEnumStringsRaw    = table_raw;
            WebGLEnumStringsPretty = table_dec;

            var table_base = {};
            var table_sub  = {};
            var enums_base = ResourceType;
            var enums_sub  = ResourceSubType;
            for (var name in enums_base)
            {
                var value  = enums_base[name];
                table_base[value] = name;
            }
            for (var name in enums_sub)
            {
                var value  = enums_sub[name];
                table_sub[value]  = name;
            }
            WebGLBaseTypeStrings = table_base;
            WebGLSubTypeStrings  = table_sub;
        }
    }

    /// @summary Converts a ResourceType enum value into its corresponding
    /// string name. The resulting string can be used as a key in ResourceType.
    /// @param value The numeric enum value.
    /// @returns The string equivalent of the enum value, or undefined.
    function basetype(value)
    {
        if (WebGLEnumStringsInit)
        {
            initEnumStrings();
        }
        return WebGLBaseTypeStrings[value];
    }

    /// @summary Converts a ResourceSubType enum value into its corresponding
    /// string name. The resulting string can be used as a key in the
    /// ResourceSubType table.
    /// @param value The numeric enum value.
    /// @returns The string equivalent of the enum value, or undefined.
    function subtype(value)
    {
        if (WebGLEnumStringsInit)
        {
            initEnumStrings();
        }
        return WebGLSubTypeStrings[value];
    }

    /// @summary Converts a WebGL enum value into its corresponding string name.
    /// The returned string can be used as a key in WebGLConstants or a
    /// WebGLRenderingContext object.
    /// @param value The numeric enum value.
    /// @returns The string equivalent of the enum value, or 'INVALID_ENUM' if
    /// a value is specified that does not correspond to a valid enum value.
    function enumraw(value)
    {
        if (WebGLEnumStringsInit)
        {
            initEnumStrings();
        }
        var str   = WebGLEnumStringsRaw[value];
        if (str === undefined)
            str   = 'INVALID_ENUM';
        return str;
    }

    /// @summary Converts a WebGL enum value into its corresponding string name.
    /// The hexadecimal value of the enum is encoded as well. This function is
    /// intended for displaying debug output.
    /// @param value The numeric enum value.
    /// @returns A string in the format '0x1902 (GL_DEPTH_COMPONENT)'.
    function enumfmt(value)
    {
        if (WebGLEnumStringsInit)
        {
            initEnumStrings();
        }
        var str   = WebGLEnumStringsPretty[value];
        if (str === undefined)
            str   = '0x' + value.toString(16) + ' (INVALID_ENUM)';
        return str;
    }

    /// @summary Performs a test to determine whether the current runtime
    /// environment supports WebGL; however, just because the runtime supports
    /// WebGL does not guarantee that context creation will be successful.
    /// @return true if the runtime environment supports WebGL.
    function supported()
    {
        return (window.WebGLRenderingContext ? true : false);
    }

    /// @summary Attempts to create a new WebGL rendering context.
    /// @param canvas The HTMLCanvasElement into which WebGL will render.
    /// @param attributes A WebGLContextAttributes object. See:
    /// https://www.khronos.org/registry/webgl/specs/1.0/#5.2
    /// @param attributes.debug Specify true to return a debug context.
    /// @param attributes.logCallback A function (func_name, args) to call for 
    /// each low-level WebGL call performed. Specifying a callback implies the 
    /// @a attributes.debug flag is set to true.
    /// @param attributes.errorCallback  A function (error, func_name, args) to
    /// call whenever an error is returned from gl.getError(). Specifying a 
    /// callback implies the @a attributes.debug flag is set to true.
    /// @return A new instance of GraphicsContext, or undefined if WebGL is not
    /// supported or the context cannot be created for some reason.
    function createContext(canvas, attributes)
    {
        var gl    = null;
        var names = [
            'webgl',
            'experimental-webgl',
            'webkit-3d',
            'moz-webgl'
        ];
        for (var i = 0, n = names.length; i < n; ++i)
        {
            try {
                gl = canvas.getContext(names[i], attributes);
                if (gl)
                {
                    // do any one-time setup, and return the context.
                    initGLSLTable();
                    initEnumStrings();
                    if (attributes.logCallback || attributes.errorCallback)
                        attributes.debug = true;
                    if (attributes.debug && WebGLDebugUtils)
                    {
                        WebGLDebugUtils.init();
                        gl = WebGLDebugUtils.makeDebugContext(
                            gl, 
                            attributes.errorCallback, 
                            attributes.logCallback);
                    }
                    return gl;
                }
            }
            catch (error) {
                /* empty */
            }
        }
    }

    /// @summary Creates an object describing a single field within an element
    /// structure stored in a data buffer.
    /// @param name The name of the field. This should match the name of
    /// the corresponding attribute in the shader program.
    /// @param type A string value indicating the field data type, one of
    /// BYTE, UNSIGNED_BYTE, SHORT, UNSIGNED_SHORT, INT, UNSIGNED_INT or FLOAT.
    /// @param offset The byte offset of the field from the start of the
    /// element structure.
    /// @param dimension The number of values of the specified type that make
    /// up the field, for example, 3 to specify a 3-component vector.
    /// @param normalize A boolean value indicating whether the runtime should
    /// convert non-floating point data into a normalized floating-point value
    /// in the range [0, 1] prior to exposing it to the shader.
     /// @return An object describing the element field.
    /// obj.name The name of the field.
    /// obj.dataType The WebGL data type of the field.
    /// obj.byteOffset The byte offset from the start of the vertex.
    /// obj.dimension The number of values that make up the field.
    /// obj.normalize A boolean value indicating whether the hardware will
    /// convert non-floating point data into the range [0, 1] before use.
    function field(name, type, offset, dimension, normalize)
    {
        return {
            name        : name,
            dataType    : WebGLConstants[type],
            byteOffset  : offset,
            dimension   : dimension,
            normalize   : normalize
        };
    }

    /// @summary Calculates the size of a single field of an element record.
    /// @param field The field definition, as returned by WebGL.field().
    /// @param debug An optional WebGL.Emitter object used for debug reporting.
    /// @return The size of the specified field, in bytes.
    function fieldSize(field, debug)
    {
        if (field)
        {
            var GL = WebGLConstants;
            switch  (field.dataType)
            {
                case GL.FLOAT:
                case GL.INT:
                case GL.UNSIGNED_INT:
                    return 4 * field.dimension;

                case GL.BYTE:
                case GL.UNSIGNED_BYTE:
                    return 1 * field.dimension;

                case GL.SHORT:
                case GL.UNSIGNED_SHORT:
                    return 2 * field.dimension;

                default:
                    break;
            }
        }
        return 0;
    }

    /// @summary Calculates the size of a logical buffer element comprised of
    /// one or more fields.
    /// @param fields An array of field descriptor objects. See WebGL.field().
    /// The fields must be sorted into order by byte offset.
    /// @param debug An optional WebGL.Emitter object used for debug reporting.
    /// @return The size of the logical element structure, in bytes.
    function elementSize(fields, debug)
    {
        var n    = fields.length;
        if (n  === 0)
            return 0;
        // sum the byte offsets and then add in the size of the final attribute.
        // this ensures that user-added padding is properly accounted for.
        var e = fields[n - 1];
        var o = e.byteOffset;
        var s = fieldSize(e, debug);
        return (o+s);
    }

    /// @summary A comparison function used for ordering fields by byte offset.
    /// @param a A field descriptor object. See WebGL.field().
    /// @param b A field descriptor object. See WebGL.field().
    /// @return 0 if the byte offsets of a and b are equal, +1 if the byte
    /// offset of a is greater than that of b, or -1 if the byte offset of a is
    /// less than the byte offset of b.
    function orderByByteOffset(a, b)
    {
        if (a.byteOffset > b.byteOffset)
            return +1;
        if (a.byteOffset < b.byteOffset)
            return -1;
        return 0;
    }

    /// @summary Creates an object containing array buffer views, strides and
    /// offsets for a given data buffer. The returned object allows for dynamic
    /// modification of interleaved buffers.
    /// @param data The ArrayBuffer used for storing the interleaved data.
    /// @param fields An array of element field descriptors describing the
    /// structure of each logical element in the buffer. See WebGL.field().
    /// @param debug An optional WebGL.Emitter object used for debug reporting.
    /// @return An object providing access to the interleaved data.
    /// obj.arrayViews An array of @a fields.length ArrayBufferView instances
    /// of the appropriate type (Float32Array, etc.)
    /// obj.baseOffsets An array of @a fields.length numbers specifying the
    /// base offset within obj.arrayViews of the field data in units of the
    /// appropriate type (Float32, etc.) These values should remain constant.
    /// obj.offsets An array of @a fields.length numbers specifying the current
    /// offset within obj.arrayViews of the attribute data for the current
    /// element field, in units of the appropriate type. Values in this array
    /// are intended to be modified during buffer iteration, and may be reset
    /// to the base offsets by calling WebGL.resetBufferView().
    /// obj.sizes An array of @a fields.length numbers specifying the size of
    /// each element field, in units of the appropriate type. These values
    /// should remain constant and not be modified by the caller.
    function createBufferView(data, fields, debug)
    {
        var GL      = WebGLConstants;
        var stride  = elementSize(fields, debug);
        var offsets = new Array(fields.length);
        var current = new Array(fields.length);
        var sizes   = new Array(fields.length);
        var views   = new Array(fields.length);

        for (var i  = 0,  n   = fields.length; i < n; ++i)
        {
            var rec = fields[i];
            var ofs = rec.byteOffset;
            switch   (rec.dataType)
            {
                case GL.FLOAT:
                    views[i]   = new Float32Array(data);
                    sizes[i]   = stride / 4;
                    offsets[i] = ofs    / 4;
                    current[i] = ofs    / 4;
                    break;

                case GL.UNSIGNED_BYTE:
                    views[i]   = new Uint8Array(data);
                    sizes[i]   = stride / 1;
                    offsets[i] = ofs    / 1;
                    current[i] = ofs    / 1;
                    break;

                case GL.UNSIGNED_SHORT:
                    views[i]   = new Uint16Array(data);
                    sizes[i]   = stride / 2;
                    offsets[i] = ofs    / 2;
                    current[i] = ofs    / 2;
                    break;

                case GL.UNSIGNED_INT:
                    views[i]   = new Uint32Array(data);
                    sizes[i]   = stride / 4;
                    offsets[i] = ofs    / 4;
                    current[i] = ofs    / 4;
                    break;

                case GL.BYTE:
                    views[i]   = new Int8Array(data);
                    sizes[i]   = stride / 1;
                    offsets[i] = ofs    / 1;
                    current[i] = ofs    / 1;
                    break;

                case GL.SHORT:
                    views[i]   = new Int16Array(data);
                    sizes[i]   = stride / 2;
                    offsets[i] = ofs    / 2;
                    current[i] = ofs    / 2;
                    break;

                case GL.INT:
                    views[i]   = new Int32Array(data);
                    sizes[i]   = stride / 4;
                    offsets[i] = ofs    / 4;
                    current[i] = ofs    / 4;
                    break;

                default :
                    return null;
            }
        }
        return {
            arrayViews  : views,
            baseOffsets : offsets,
            offsets     : current,
            sizes       : sizes
        };
    }

    /// @summary Resets the values in the @a view.offsets field to the base
    /// values specified by @a view.baseOffsets. This function should be called
    /// prior to iterating over the contents of the buffer.
    /// @param views An object providing views into an interleaved buffer. See
    /// the function WebGL.createBufferView().
    /// @return A reference to @a view.
    function resetBufferView(view)
    {
        var base    = view.baseOffsets;
        var curr    = view.offsets;
        for (var i  = 0, n = curr.length; i < n; ++i)
            curr[i] = base[i];
        return view;
    }

    /// @summary Given an element definition and a set of arrays filled with
    /// data for each individual element field, constructs an interleaved
    /// ArrayBuffer filled with the element data.
    /// @param fields An array of element field definitions specifying the
    /// layout of the element structure. See WebGL.field().
    /// @param arrays An array of JavaScript arrays. Each array specifies the
    /// data for the corresponding element field.
    /// @param count The number of elements in the buffer.
    /// @param debug An optional WebGL.Emitter object used for debug reporting.
    /// @return An object providing access to the interleaved data.
    /// obj.data A new ArrayBuffer instance containing the interleaved data.
    /// This buffer can be directly supplied to a WebGL Buffer's upload method.
    /// obj.view The data necessary to access and modify the interleaved data,
    /// as returned by the function WebGL.createBufferView().
    function interleave(fields, arrays, count, debug)
    {
        var stride = elementSize(fields, debug);
        var buffer = new ArrayBuffer(stride * count);
        var access = createBufferView(buffer, fields, debug);
        var offset = access.offsets;
        var sizes  = access.sizes;
        var views  = access.arrayViews;
        for (var i = 0; i < count; ++i)
        {                              // i is the element index
            for (var j = 0, n = fields.length; j < n; ++j)
            {                          // j is the field index
                var fr = fields[j];    // select the element field record
                var sa = arrays[j];    // select the source data array
                var o  = offset[j];    // offset of the field in FLOATs, etc.
                var dv = views [j];    // the view for the field
                var vd = fr.dimension; // the vector dimension
                var bi = i * vd;
                for (var k = 0; k < vd; ++k)
                    dv[o + k] = sa [bi  + k];
                offset[j] += sizes[j]; // move to the next element
            }
        }
        return   {
            data : buffer,
            view : resetBufferView(access)
        };
    }

    /// @summary Creates an ArrayBufferView appropriate to the underlying data
    /// type for the texture data. This view provides access to the data for a
    /// single level of a mipmap chain.
    /// @param data The Uint8Array view of the image data.
    /// @param unitType A string value specifying the type of the smallest
    /// addressable unit of image data, one of UNSIGNED_BYTE, UNSIGNED_SHORT,
    /// UNSIGNED_SHORT_5_6_5, UNSIGNED_SHORT_5_5_5_1, UNSIGNED_SHORT_4_4_4_4,
    /// HALF_FLOAT_OES, FLOAT, UNSIGNED_INT or UNSIGNED_INT_24_8_WEBGL.
    /// @param levelOffset The byte offset of the start of the mip-level.
    /// @param levelSize The size of the mip-level data, in bytes.
    /// @param debug An optional WebGL.Emitter object used for debug reporting.
    /// @return A new instance of either Uint8Array, Uint16Array, Uint32Array
    /// or Float32Array that can be used to access the raw data for the
    /// mip-level. If the internal data type is invalid, null is returned.
    function createImageView(data, unitType, levelOffset, levelSize, debug)
    {
        var GL     = WebGLConstants;
        var offset = data.byteOffset + levelOffset;
        var buffer = data.buffer;
        var size   = levelSize;
        var type   = GL[unitType];
        var view   = null;

        switch (type)
        {
            case GL.UNSIGNED_BYTE:
                view = new Uint8Array(buffer, offset, size);
                break;

            case GL.UNSIGNED_SHORT:
            case GL.UNSIGNED_SHORT_5_6_5:
            case GL.UNSIGNED_SHORT_5_5_5_1:
            case GL.UNSIGNED_SHORT_4_4_4_4:
            case GL.HALF_FLOAT_OES:
                view = new Uint16Array(buffer, offset,  size / 2);
                break;

            case GL.UNSIGNED_INT:
            case GL.UNSIGNED_INT_24_8_WEBGL:
                view = new Uint32Array(buffer, offset,  size / 4);
                break;

            case GL.FLOAT:
                view = new Float32Array(buffer, offset, size / 4);
                break;

            default:
                break;
        }
        return view;
    }

    /// @summary Determines the attributes to required to represent an image
    /// with the specified properties, taking into account restrictions for
    /// compressed and packed formats.
    /// @param width The width of the image, in pixels.
    /// @param height The height of the image, in pixels.
    /// @param pixelFormat A string value specifying the pixel format. May be
    /// one of ALPHA, LUMINANCE, LUMINANCE_ALPHA, RGB or RGBA. Optional
    /// implementation-supported values are DEPTH_COMPONENT, DEPTH_STENCIL,
    /// SRGB_EXT and SRGB_ALPHA_EXT.
    /// @param pixelType A string value specifying the pixel type. May be one
    /// of UNSIGNED_BYTE, UNSIGNED_SHORT, UNSIGNED_INT, FLOAT, HALF_FLOAT_OES,
    /// UNSIGNED_SHORT_5_5_5_1, UNSIGNED_SHORT_4_4_4_4, UNSIGNED_SHORT_5_6_5,
    /// UNSIGNED_INT_24_8_WEBGL, or a compressed type.
    /// @param debug An optional WebGL.Emitter object used for debug reporting.
    /// @return An object specifying the image storage attributes.
    /// obj.width The width of the image, in pixels.
    /// obj.height The height of the image, in pixels.
    /// obj.byteSize The number of bytes required to store the image data.
    function imageStorageAttributes(width, height, pixelFormat, pixelType, debug)
    {
        var GL     = WebGLConstants;
        var format = GL[pixelFormat];
        var type   = GL[pixelType];
        var count  = 0;
        var size   = 0;

        // figure out how many components there are in a logical pixel.
        switch (format)
        {
            case GL.DEPTH_COMPONENT:
            case GL.ALPHA:
            case GL.LUMINANCE:
                count = 1;
                break;
            case GL.DEPTH_STENCIL:
            case GL.LUMINANCE_ALPHA:
                count = 2;
                break;
            case GL.RGB:
            case GL.SRGB_EXT:
                count = 3;
                break;
            case GL.RGBA:
            case GL.SRGB_ALPHA_EXT:
                count = 4;
                break;
        }

        // now adjust dimensions and compute total sized based on storage type.
        switch (type)
        {
            case GL.UNSIGNED_BYTE:
                size = width * height * count;
                break;
            case GL.UNSIGNED_SHORT:
            case GL.HALF_FLOAT_OES:
                size = width * height * count * 2;
                break;
            case GL.UNSIGNED_INT:
            case GL.FLOAT:
                size = width * height * count * 4;
                break;
            case GL.UNSIGNED_SHORT_4_4_4_4:
            case GL.UNSIGNED_SHORT_5_5_5_1:
            case GL.UNSIGNED_SHORT_5_6_5:
                size = width * height * 2;
                break;
            case GL.UNSIGNED_INT_24_8_WEBGL:
                size = width * height * 4;
                break;
            case GL.COMPRESSED_RGB_ATC_WEBGL:
            case GL.COMPRESSED_RGB_S3TC_DXT1_EXT:
            case GL.COMPRESSED_RGBA_S3TC_DXT1_EXT:
                width  = Math.floor((width  + 3) / 4);
                height = Math.floor((height + 3) / 4);
                size   =(width * height)    * 8;
                break;
            case GL.COMPRESSED_RGBA_S3TC_DXT3_EXT:
            case GL.COMPRESSED_RGBA_S3TC_DXT5_EXT:
            case GL.COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL:
            case GL.COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL:
                width  = Math.floor((width  + 3) / 4);
                height = Math.floor((height + 3) / 4);
                size   =(width * height)    * 16;
                break;
            case GL.COMPRESSED_RGB_PVRTC_2BPPV1_IMG:
            case GL.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG:
                width  = Math.max(width,   16);
                height = Math.max(height,   8);
                size   =(width  * height) / 4;
                break;
            case GL.COMPRESSED_RGB_PVRTC_4BPPV1_IMG:
            case GL.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG:
                width  = Math.max(width,    8);
                height = Math.max(height,   8);
                size   =(width  * height) / 2;
                break;
        }
        return {
            width    : width,
            height   : height,
            byteSize : size
        };
    }

    /// @summary Computes the number of levels in the mip-chain for a given
    /// set of image dimensions.
    /// @param width The width of the highest-resolution image, in pixels.
    /// @param height The height of the highest-resolution image, in pixels.
    /// @param slices The number of slices (depth) of the base level image.
    /// @return The number of levels in the mip-pyramid.
    function mipLevelCount(width, height, slices)
    {
        if (width  < 1) width  = 1;
        if (height < 1) height = 1;
        if (slices < 1) slices = 1;

        var levelCount     = 0;
        var majorDimension = 0;

        // select the largest of (width, height, slices):
        majorDimension = (width  > height)         ? width  : height;
        majorDimension = (slices > majorDimension) ? slices : majorDimension;

        // compute levels down to 1 in the major dimension.
        while (majorDimension > 0)
        {
            majorDimension  >>= 1;
            levelCount++;
        }
        return levelCount;
    }

    /// @summary Computes the value of a dimension (width, height or slice) of
    /// an image given the value of the corresponding dimension in the highest-
    /// resolution level of the image and the index of the target mip-level.
    /// @param baseDimension The width, height or number of slices in the
    /// highest-resolution (base) level of the image.
    /// @param levelIndex The zero-based index of the mip-level, with level
    /// zero representing the level with the highest resolution.
    /// @return The width, height or slice count in the specified mip-level.
    function mipLevelDimension(baseDimension, levelIndex)
    {
        var levelDimension = baseDimension >> levelIndex;
        return (levelDimension <= 0) ? 1 : levelDimension;
    }

    /// @summary Inspects vertex and fragment shader source code to extract the
    /// names and types of all uniform values.
    /// @param vss A string specifying the vertex shader source code.
    /// @param fss A string specifying the fragment shader source code.
    /// @return An object specifying information about the names and types of
    /// each uniform value in the shader program.
    /// obj.names An array of string uniform names.
    /// obj.types A table mapping uniform name to its GLSL type enum.
    function reflectUniforms(vss, fss)
    {
        if (WebGLShaderDataTypesInit)
        {
            initGLSLTable();
        }

        var Types = WebGLShaderDataTypes;
        var match = /uniform\s+(\w+)\s+(\w+)\s*;/g
        var vert  = vss.match(match);
        var frag  = fss.match(match);
        var names = [];
        var types = {};
        if (vert)
        {
            for (var i = 0; i < vert.length; ++i)
            {
                var uniform = vert[i].split(match);
                var type    = uniform[1];
                var name    = uniform[2];
                types[name] = Types[type];
                names.push(name);
            }
        }
        if (frag)
        {
            for (var i = 0; i < frag.length; ++i)
            {
                var uniform = frag[i].split(match);
                var type    = uniform[1];
                var name    = uniform[2];
                types[name] = Types[type];
                names.push(name);
            }
        }
        return {
            names : names,
            types : types
        };
    }

    /// @summary Inspects vertex shader source code to extract the names and
    /// types of all vertex attributes.
    /// @param vss A string specifying the vertex shader source code.
    /// @return An object specifying information about the names and types of
    /// each vertex attribute in the shader program.
    /// obj.names An array of string vertex attribute names.
    /// obj.types A table mapping attribute name to its GLSL type enum.
    function reflectAttributes(vss)
    {
        if (WebGLShaderDataTypesInit)
        {
            initGLSLTable();
        }

        var Types = WebGLShaderDataTypes;
        var match = /attribute\s+(\w+)\s+(\w+)\s*;/g
        var vert  = vss.match(match);
        var names = [];
        var types = {};
        if (vert)
        {
            for (var i = 0; i < vert.length; ++i)
            {
                var attrib  = vert[i].split(match);
                var type    = attrib[1];
                var name    = attrib[2];
                types[name] = Types[type];
                names.push(name);
            }
        }
        return {
            names : names,
            types : types
        };
    }

    /// @summary Constructor function for a type representing a WebGL shader
    /// program object, with attached vertex and fragment shaders.
    /// @return A reference to the new Program instance.
    var Program = function ()
    {
        if (!(this instanceof Program))
            return new Program();

        this.type               = ResourceType.SHADER_PROGRAM;
        this.subType            = ResourceSubType.GRAPHICS_SHADER;
        this.isBacked           = false;
        this.program            = null;
        this.vertexShader       = null;
        this.fragmentShader     = null;
        this.vertexShaderCode   = '';
        this.fragmentShaderCode = '';
        this.uniformNames       = [];
        this.uniformTypes       = {};
        this.uniformLocations   = {};
        this.attributeNames     = [];
        this.attributeTypes     = {};
        this.attributeIndices   = {};
        this.boundTextureCount  = 0;
        return this;
    };

    /// @summary Serializes the current contents of the instance into an object
    /// that can be passed to Program.specifyAttributes() to restore state.
    /// @return An object with the same fields expected on the args argument of
    /// the Program.specifyAttributes() function.
    Program.prototype.serialize = function ()
    {
        return {
            vertexShader   : this.vertexShaderCode,
            fragmentShader : this.fragmentShaderCode
        };
    };

    /// @summary Specifies the creation attributes of the shader program.
    /// @param args An object specifying creation attributes for the resource.
    /// @param args.vertexShader The vertex shader source code.
    /// @param args.fragmentShader The fragment shader source code.
    /// @return The Program.
    Program.prototype.specifyAttributes = function (args)
    {
        // ensure that all required arguments are specified.
        args                = args || {};
        args.vertexShader   = args.vertexShader   || '';
        args.fragmentShader = args.fragmentShader || '';

        // now cache everything on the Program instance.
        this.vertexShaderCode   = args.vertexShader;
        this.fragmentShaderCode = args.fragmentShader;
        return this;
    };

    /// @summary Creates the backing WebGLProgram object by compiling both the
    /// vertex and fragment shaders, linking them, and reflecting them.
    /// @param gl The WebGLRenderingContext.
    /// @param debug An optional WebGL.Emitter object used for debug reporting.
    /// @return true if the WebGL resources were created successfully.
    Program.prototype.createBackingResources = function (gl, debug)
    {
        if (!this.isBacked)
        {
            var vss = this.vertexShaderCode;
            var fss = this.fragmentShaderCode;
            var vs  = gl.createShader(gl.VERTEX_SHADER);
            var fs  = gl.createShader(gl.FRAGMENT_SHADER);

            gl.shaderSource (vs, vss);
            gl.compileShader(vs);
            if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS) &&
                !gl.isContextLost())
            {
                var log = gl.getShaderInfoLog(vs);
                var src = vss;
                gl.deleteShader(fs);
                gl.deleteShader(vs);
                if (debug)
                {
                    debug.emit('Program:createBackingResources', this, log, src);
                }
                return false;
            }

            gl.shaderSource (fs, fss);
            gl.compileShader(fs);
            if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS) &&
                !gl.isContextLost())
            {
                var log = gl.getShaderInfoLog(fs);
                var src = fss;
                gl.deleteShader(fs);
                gl.deleteShader(vs);
                if (debug)
                {
                    debug.emit('Program:createBackingResources', this, log, src);
                }
                return false;
            }

            var program = gl.createProgram();
            gl.attachShader(program, vs);
            gl.attachShader(program, fs);

            // the vertex attribute locations must be specified pre-linking.
            var attrib  = reflectAttributes(vss);
            var aNames  = attrib.names;
            var aTypes  = attrib.types;
            var aIndex  = {};
            for (var i  = 0, n = aNames.length; i < n; ++i)
            {
                var name     = aNames[i];
                aIndex[name] = i;
                gl.bindAttribLocation(program, i, name);
            }

            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS) &&
                !gl.isContextLost())
            {
                var log = gl.getProgramInfoLog(program);
                var src = vss + '\n\n' +  fss;
                gl.detachShader (program, fs);
                gl.detachShader (program, vs);
                gl.deleteProgram(program);
                gl.deleteShader (fs);
                gl.deleteShader (vs);
                if (debug)
                {
                    debug.emit('Program:createBackingResources', this, log, src);
                }
                return false;
            }

            // the uniform binding locations must be retrieved post-linking.
            var uniform = reflectUniforms(vss, fss);
            var uNames  = uniform.names;
            var uTypes  = uniform.types;
            var uIndex  = {};
            for (var i  = 0, n = uNames.length; i < n; ++i)
            {
                var name     = uNames[i];
                uIndex[name] = gl.getUniformLocation(program, name);
            }

            this.program          = program;
            this.vertexShader     = vs;
            this.fragmentShader   = fs;
            this.uniformNames     = uNames;
            this.uniformTypes     = uTypes;
            this.uniformLocations = uIndex;
            this.attributeNames   = aNames;
            this.attributeTypes   = aTypes;
            this.attributeIndices = aIndex;
            this.isBacked = true;
        }
        return this.isBacked;
    };

    /// @summary Destroys the backing WebGLProgram object.
    /// @param gl The WebGLRenderingContext.
    /// @return The Program.
    Program.prototype.deleteBackingResources = function (gl)
    {
        if (this.isBacked)
        {
            if (gl && !gl.isContextLost())
            {
                gl.detachShader (this.program, this.fragmentShader);
                gl.detachShader (this.program, this.vertexShader);
                gl.deleteShader (this.fragmentShader);
                gl.deleteShader (this.vertexShader);
                gl.deleteProgram(this.program);
            }
            this.fragmentShader = null;
            this.vertexShader   = null;
            this.program        = null;
            this.isBacked       = false;
        }
        return this;
    };

    /// @summary Constructor function for a type representing a WebGL data
    /// buffer resource, which can be used to store vertex, index or other
    /// generic data for use on the GPU.
    /// @return A reference to the new Buffer instance.
    var Buffer = function ()
    {
        if (!(this instanceof Buffer))
            return new Buffer();

        this.type         = ResourceType.DATA_BUFFER;
        this.subType      = ResourceSubType.UNKNOWN;
        this.isBacked     = false;
        this.buffer       = null;
        this.usage        = '';
        this.bindQuery    = 0;
        this.bindTarget   = 0;
        this.updateType   = 0;
        this.totalSize    = 0;
        this.elementSize  = 0;
        this.elementCount = 0;
        return this;
    };

    /// @summary Serializes the current contents of the instance into an object
    /// that can be passed to Buffer.specifyAttributes() to restore state.
    /// @return An object with the same fields expected on the args argument of
    /// the Buffer.specifyAttributes() function.
    Buffer.prototype.serialize = function ()
    {
        return {
            usage        : subtype(this.subType),
            updateType   : this.usage,
            elementSize  : this.elementSize,
            elementCount : this.elementCount
        };
    };

    /// @summary Specifies the creation attributes of the data buffer.
    /// @param args An object specifying creation attributes for the resource.
    /// @param args.usage A string value specifying the buffer usage, one of
    /// VERTEX_BUFFER, INDEX_BUFFER, ELEMENT_BUFFER, UNIFORM_BUFFER or 
    /// GENERIC_BUFFER. The default is GENERIC_BUFFER.
    /// @param args.updateType A string value specifying how often the buffer
    /// will be updated, one of STATIC_DRAW, STREAM_DRAW or DYNAMIC_DRAW. The
    /// default is STREAM_DRAW.
    /// @param args.elementSize The size of a single logical element, in bytes.
    /// @param args.elementCount The total number of logical elements the
    /// buffer can hold (ie. the number of vertices or indices.)
    /// @return true if the creation attributes were validated and stored.
    Buffer.prototype.specifyAttributes = function (args)
    {
        var def = function (value, default_value)
            {
                if (value !== undefined)
                    return value;
                else
                    return default_value;
            };

        // ensure that all required arguments are specified.
        args              = args || {};
        args.usage        = def(args.usage, 'GENERIC_BUFFER');
        args.updateType   = def(args.updateType, 'STREAM_DRAW');
        args.elementSize  = def(args.elementSize, 1);
        args.elementCount = def(args.elementCount, 0);
        if (args.elementSize  < 1) args.elementSize  = 1;
        if (args.elementCount < 0) args.elementCount = 0;

        // now cache everything on the Buffer instance.
        this.subType      = ResourceSubType[args.usage];
        this.usage        = args.updateType;
        this.elementSize  = args.elementSize;
        this.elementCount = args.elementCount;
        this.totalSize    = args.elementSize * args.elementCount;
        return true;
    };

    /// @summary Creates the backing WebGLBuffer object.
    /// @param gl The WebGLRenderingContext.
    /// @param debug An optional WebGL.Emitter object used for debug reporting.
    /// @return true if the WebGL resources were created successfully.
    Buffer.prototype.createBackingResources = function (gl, debug)
    {
        if (!this.isBacked)
        {
            var bindQuery  = 0;
            var bindTarget = 0;
            var updateType = gl[this.usage];

            switch (this.subType)
            {
                case ResourceSubType.VERTEX_BUFFER:
                case ResourceSubType.UNIFORM_BUFFER:
                case ResourceSubType.GENERIC_BUFFER:
                    bindQuery  = gl.ARRAY_BUFFER_BINDING;
                    bindTarget = gl.ARRAY_BUFFER;
                    break;

                case ResourceSubType.ELEMENT_BUFFER:
                    bindQuery  = gl.ELEMENT_ARRAY_BUFFER_BINDING;
                    bindTarget = gl.ELEMENT_ARRAY_BUFFER;
                    break;
            }

            var  active   = gl.getParameter(bindQuery);
            var  buffer   = gl.createBuffer();
            if (!buffer)  return false;
            gl.bindBuffer(bindTarget, buffer);
            gl.bufferData(bindTarget, this.totalSize, updateType)
            gl.bindBuffer(bindTarget, active);

            this.buffer     = buffer;
            this.bindQuery  = bindQuery;
            this.bindTarget = bindTarget;
            this.updateType = updateType;
            this.isBacked   = true;
        }
        return this.isBacked;
    };

    /// @summary Destroys the backing WebGLBuffer object.
    /// @param gl The WebGLRenderingContext.
    /// @return The Buffer.
    Buffer.prototype.deleteBackingResources = function (gl)
    {
        if (this.isBacked)
        {
            if (gl && !gl.isContextLost())
            {
                gl.deleteBuffer(this.buffer);
            }
            this.buffer   = null;
            this.isBacked = false;
        }
        return this;
    };

    /// @summary Uploads data into the buffer. The entire buffer is replaced.
    /// @param gl The WebGLRenderingContext.
    /// @param data An ArrayBuffer or ArrayBufferView specifying the data to
    /// upload. The entire view is uploaded to the buffer.
    /// @return The Buffer.
    Buffer.prototype.upload = function (gl, data)
    {
        gl.bindBuffer(this.bindTarget, this.buffer);
        gl.bufferData(this.bindTarget, data, this.updateType);
        return this;
    };

    /// @summary Uploads data into a region of the buffer.
    /// @param gl The WebGLRenderingContext.
    /// @param byteOffset The byte offset of the start of the region to update.
    /// @param data An ArrayBuffer or ArrayBufferView specifying the data to
    /// upload. The entire view is uploaded to the buffer region.
    /// @return The Buffer.
    Buffer.prototype.uploadRegion = function (gl, byteOffset, data)
    {
        gl.bindBuffer(this.bindTarget, this.buffer);
        gl.bufferSubData(this.bindTarget, byteOffset, data);
        return this;
    };

    /// @summary Constructor function for a type representing a WebGL texture
    /// resource, which can be used as a sampler source.
    /// @return A reference to the new Texture instance.
    var Texture = function ()
    {
        if (!(this instanceof Texture))
            return new Texture();

        this.type          = ResourceType.TEXTURE;
        this.subType       = ResourceSubType.UNKNOWN;
        this.isBacked      = false;
        this.hasMipmaps    = false;
        this.texture       = null;
        this.levels        = [];
        this.target        = '';
        this.format        = '';
        this.dataType      = '';
        this.userType      = '';
        this.wrapModeS     = '';
        this.wrapModeT     = '';
        this.magnifyFilter = '';
        this.minifyFilter  = '';
        this.bindQuery     = 0;
        this.bindTarget    = 0;
        this.textureTarget = 0;
        return this;
    };

    /// @summary Serializes the current contents of the instance into an object
    /// that can be passed to Texture.specifyAttributes() to restore state.
    /// @return An object with the same fields expected on the args argument of
    /// the Texture.specifyAttributes() function.
    Texture.prototype.serialize = function ()
    {
        return {
            type       : this.userType,
            usage      : subtype(this.subType),
            target     : this.target,
            format     : this.format,
            dataType   : this.dataType,
            wrapS      : this.wrapModeS,
            wrapT      : this.wrapModeT,
            magFilter  : this.magnifyFilter,
            minFilter  : this.minifyFilter,
            compressed : this.isCompressed,
            hasMipmaps : this.hasMipmaps,
            levels     : this.levels.slice(0)
        };
    };

    /// @summary Specifies the creation attributes of the texture.
    /// @param args An object specifying creation attributes for the resource.
    /// @param args.type A string value specifying a user-defined texture type
    /// attribute. This typically describes the usage of the texture, for
    /// example, 'COLOR' for a texture containing color data, 'NORMAL' for a
    /// normal map texture, and so on.
    /// @param args.usage A string value specifying the texture usage, one of:
    /// TEXTURE_2D, TEXTURE_CUBE or TEXTURE_DEPTH. The default is TEXTURE_2D.
    /// @param args.target A string value specifying the texture target, one of:
    /// TEXTURE_2D, TEXTURE_CUBE_MAP_POSITIVE_[X,Y,Z] or
    /// TEXTURE_CUBE_MAP_NEGATIVE_[X,Y,Z]. The default is TEXTURE_2D.
    /// @param args.format A string value specifying the texture type. May be
    /// one of ALPHA, LUMINANCE, LUMINANCE_ALPHA, RGB or RGBA. Optional
    /// implementation-supported values are DEPTH_COMPONENT, DEPTH_STENCIL,
    /// SRGB_EXT, SRGB_ALPHA_EXT or any of the compressed texture formats. The
    /// default is RGBA.
    /// @param args.dataType A string value specifying the internal data type.
    /// One of UNSIGNED_BYTE, UNSIGNED_SHORT_5_6_5 or UNSIGNED_SHORT_5_5_5_1.
    /// Optional implementation-supported values are UNSIGNED_SHORT,
    /// UNSIGNED_INT, FLOAT, HALF_FLOAT_OES and UNSIGNED_INT_24_8_WEBGL. For
    /// compressed texture formats, specify UNSIGNED_BYTE or leave undefined.
    /// The default is UNSIGNED_BYTE.
    /// @param args.wrapS A string value specifying the wrapping mode to use in
    /// the horizontal direction. This value may be one of REPEAT, CLAMP_TO_EDGE
    /// or MIRRORED_REPEAT. The default is CLAMP_TO_EDGE.
    /// @param args.wrapT A string value specifying the wrapping mode to use in
    /// the vertical direction. Supports the same values as @a args.wrapS.
    /// @param args.magFilter A string value specifying the filter to use when
    /// the image is magnified. One of NEAREST or LINEAR. Default is NEAREST.
    /// @param args.minFilter A string value specifying the filter to use when
    /// the image is minified. One of NEAREST or LINEAR. If a mipmap chain
    /// is attached, one of NEAREST_MIPMAP_NEAREST, LINEAR_MIPMAP_NEAREST,
    /// NEAREST_MIPMAP_LINEAR or LINEAR_MIPMAP_LINEAR. Default is NEAREST.
    /// @param args.compressed Specify true to indicate that the texture data
    /// is stored compressed on the GPU.
    /// @param args.hasMipmaps Specify true to indicate that the texture object
    /// has an attached mipmap chain.
    /// @param args.levels An array of objects describing each level in the
    /// mipmap chain. Level 0 represents the highest-resolution image. Each
    /// level object has width, height, byteSize and byteOffset attributes.
    /// This array must have at least one element, even if @a args.hasMipmaps
    /// is false, to describe the image dimensions.
    /// @return true if the creation attributes were validated and stored.
    Texture.prototype.specifyAttributes = function (args)
    {
        var def = function (value, default_value)
            {
                if (value !== undefined)
                    return value;
                else
                    return default_value;
            };

        // ensure that all required arguments are specified.
        args               = args || {};
        args.type          = def(args.type, '');
        args.usage         = def(args.usage, 'TEXTURE_2D');
        args.target        = def(args.target, 'TEXTURE_2D');
        args.format        = def(args.format, 'RGBA');
        args.dataType      = def(args.dataType, 'UNSIGNED_BYTE');
        args.wrapS         = def(args.wrapS, 'CLAMP_TO_EDGE');
        args.wrapT         = def(args.wrapT, 'CLAMP_TO_EDGE');
        args.magFilter     = def(args.magFilter, 'NEAREST');
        args.minFilter     = def(args.minFilter, 'NEAREST');
        args.compressed    = def(args.compressed, false);
        args.hasMipmaps    = def(args.hasMipmaps, false);
        args.levels        = def(args.levels, []);

        // now cache everything on the Texture instance.
        this.subType       = ResourceSubType[args.usage];
        this.isCompressed  = args.compressed;
        this.hasMipmaps    = args.hasMipmaps;
        this.target        = args.target;
        this.format        = args.format;
        this.dataType      = args.dataType;
        this.userType      = args.type;
        this.wrapModeS     = args.wrapS;
        this.wrapModeT     = args.wrapT;
        this.magnifyFilter = args.magFilter;
        this.minifyFilter  = args.minFilter;
        for (var i = 0,  n = args.levels.length; i < n; ++i)
        {
            this.levels[i] = {
                width      : args.levels[i].width,
                height     : args.levels[i].height,
                byteSize   : args.levels[i].byteSize,
                byteOffset : args.levels[i].byteOffset
            };
        }
        return true;
    };

    /// @summary Creates the backing WebGLTexture object.
    /// @param gl The WebGLRenderingContext.
    /// @param debug An optional WebGL.Emitter object used for debug reporting.
    /// @return true if the WebGL resources were created successfully.
    Texture.prototype.createBackingResources = function (gl, debug)
    {
        if (!this.isBacked)
        {
            var bindQuery    = gl.TEXTURE_BINDING_2D;
            var textTarget   = gl[this.target];
            var bindTarget   = gl[this.target];

            if (bindTarget === gl.TEXTURE_CUBE_MAP_POSITIVE_X ||
                bindTarget === gl.TEXTURE_CUBE_MAP_POSITIVE_Y ||
                bindTarget === gl.TEXTURE_CUBE_MAP_POSITIVE_Z ||
                bindTarget === gl.TEXTURE_CUBE_MAP_NEGATIVE_X ||
                bindTarget === gl.TEXTURE_CUBE_MAP_NEGATIVE_Y ||
                bindTarget === gl.TEXTURE_CUBE_MAP_NEGATIVE_Z)
            {
                bindTarget   = gl.TEXTURE_CUBE_MAP;
                bindQuery    = gl.TEXTURE_BINDING_CUBE_MAP;
            }

            var  active      = gl.getParameter(bindQuery);
            var  texture     = gl.createTexture();
            if (!texture)    return false;
            gl.bindTexture  (bindTarget, texture);
            gl.texParameteri(bindTarget, gl.TEXTURE_WRAP_S,     gl[this.wrapModeS]);
            gl.texParameteri(bindTarget, gl.TEXTURE_WRAP_T,     gl[this.wrapModeT]);
            gl.texParameteri(bindTarget, gl.TEXTURE_MIN_FILTER, gl[this.minifyFilter]);
            gl.texParameteri(bindTarget, gl.TEXTURE_MAG_FILTER, gl[this.magnifyFilter]);
            gl.bindTexture  (bindTarget, active);

            this.texture       = texture;
            this.textureTarget = textTarget;
            this.bindTarget    = bindTarget;
            this.bindQuery     = bindQuery;
            this.isBacked      = true;
        }
        return this.isBacked;
    };

    /// @summary Destroys the backing WebGLTexture object.
    /// @param gl The WebGLRenderingContext.
    /// @return The Texture.
    Texture.prototype.deleteBackingResources = function (gl)
    {
        if (this.isBacked)
        {
            if (gl && !gl.isContextLost())
            {
                gl.deleteTexture(this.texture);
            }
            this.texture  = null;
            this.isBacked = false;
        }
        return this;
    };

    /// @summary Uploads the complete mipmap chain for a texture to the GPU.
    /// @param gl The WebGLRenderingContext.
    /// @param data A Uint8Array view storing the raw data for each mip-level.
    /// @return The Texture.
    Texture.prototype.upload = function (gl, data)
    {
        var active = gl.getParameter(this.bindQuery);
        var target = this.textureTarget;
        var bind   = this.bindTarget;
        var type   = gl[this.dataType];
        var format = gl[this.format];

        gl.bindTexture(bind, this.texture);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        for (var i   = 0, n = this.levels.length; i < n; ++i)
        {
            var ld   = this.levels[i];
            var lw   = ld.width;
            var lh   = ld.height;
            var view = createImageView(data, this.dataType, ld.byteOffset, ld.byteSize);
            if (this.isCompressed)
            {
                gl.compressedTexImage2D(target, i, format, lw, lh, 0, view);
            }
            else
            {
                gl.texImage2D(target, i, format, lw, lh, 0, format, type, view);
            }
        }

        gl.bindTexture(bind, active);
        return this;
    };

    /// @summary Uploads image data to a sub-region of the texture.
    /// @param gl The WebGLRenderingContext.
    /// @param x The x-coordinate of the upper-left corner on the texture.
    /// @param y The y-coordinate of the upper-left corner on the texture.
    /// @param level The zero-based index of the target level in the mip-chain.
    /// @param srcData A Uint8Array view storing the raw image data.
    /// @param srcDesc An object describing the source data, with fields:
    /// @param srcDesc.width The width of the source image, in pixels.
    /// @param srcDesc.height The height of the source image, in pixels.
    /// @param srcDesc.byteSize The size of the source image, in bytes.
    /// @param srcDesc.byteOffset The byte offset of the source data within a
    /// larger buffer, if applicable; otherwise, 0.
    /// @return The Texture.
    Texture.prototype.uploadRegion = function (gl, x, y, level, srcData, srcDesc)
    {
        var active = gl.getParameter(this.bindQuery);
        var target = this.textureTarget;
        var bind   = this.bindTarget;
        var type   = gl[this.dataType];
        var format = gl[this.format];
        var lw     = srcDesc.width;
        var lh     = srcDesc.height;
        var offset = srcDesc.byteOffset;
        var size   = srcDesc.byteSize;
        var view   = createImageView(srcData, this.dataType, offset, size);

        gl.bindTexture(bind, this.texture);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        if (this.isCompressed)
        {
            gl.compressedTexSubImage2D(target, level, x, y, lw, lh, format, view);
        }
        else
        {
            gl.texSubImage2D(target, level, x, y, lw, lh, format, type, view);
        }
        gl.bindTexture(bind, active);
        return this;
    };

    /// @summary Uploads data to a texture object from a DOM Canvas, Image or
    /// Video element. If the texture has an associated mip-chain, it is
    /// updated using WebGLRenderingContext.generateMipmap().
    /// @param gl The WebGLRenderingContext.
    /// @param domElement An instance of HTMLImageElement, HTMLCanvasElement or
    /// HTMLVideoElement specifying the source texture data.
    /// @return The Texture.
    Texture.prototype.uploadFromDOM = function (gl, domElement)
    {
        if (this.isCompressed)
            return this;

        var active = gl.getParameter(this.bindQuery);
        var target = this.textureTarget;
        var bind   = this.bindTarget;
        var type   = gl[this.dataType];
        var format = gl[this.format];

        gl.bindTexture(bind, this.texture);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage2D (target, 0, format, format, type, domElement);
        if (this.hasMipmaps) gl.generateMipmap(target);
        gl.bindTexture(bind, active);
        return this;
    };

    /// @summary Constructor function for a type representing a WebGL
    /// renderbuffer resource, which represents a part of a render target.
    /// @return A reference to the new Renderbuffer instance.
    var Renderbuffer = function ()
    {
        if (!(this instanceof Renderbuffer))
            return new Renderbuffer();

        this.type         = ResourceType.RENDER_BUFFER;
        this.subType      = ResourceSubType.UNKNOWN;
        this.isBacked     = false;
        this.renderbuffer = null;
        this.format       = '';
        this.width        = 0;
        this.height       = 0;
        return this;
    };

    /// @summary Serializes the current contents of the instance into an object
    /// that can be passed to Renderbuffer.specifyAttributes() to restore state.
    /// @return An object with the same fields expected on the args argument of
    /// the Renderbuffer.specifyAttributes() function.
    Renderbuffer.prototype.serialize = function ()
    {
        return {
            width  : this.width,
            height : this.height,
            format : this.format,
            usage  : subtype(this.subType)
        };
    };

    /// @summary Specifies the creation attributes of the renderbuffer.
    /// @param args An object specifying creation attributes for the resource.
    /// @param args.width The width of the renderbuffer, in pixels.
    /// @param args.height The height of the renderbuffer, in pixels.
    /// @param args.format A string specifying the renderbuffer format. The
    /// string may be one of RGBA4, RGB565, RGB5_A1, DEPTH_STENCIL,
    /// STENCIL_INDEX8, and DEPTH_COMPONENT16. Optional implementation-
    /// supported values are RGB16F_EXT, RGBA16F_EXT, RGB32F_EXT, RGBA32F_EXT
    /// and SRGB_ALPHA8_EXT. The default value is DEPTH_COMPONENT16.
    /// @param args.usage A string specifying the renderbuffer usage. May be
    /// PIXEL_BUFFER, DEPTH_BUFFER, STENCIL_BUFFER or DEPTH_STENCIL_BUFFER. The
    /// default value is DEPTH_BUFFER.
    /// @return true if the creation attributes were validated and stored.
    Renderbuffer.prototype.specifyAttributes = function (args)
    {
        var def = function (value, default_value)
            {
                if (value !== undefined)
                    return value;
                else
                    return default_value;
            };

        // ensure that all required arguments are specified.
        args         = args || {};
        args.width   = def(args.width , 1);
        args.height  = def(args.height, 1);
        args.format  = def(args.format, 'DEPTH_COMPONENT16');
        args.usage   = def(args.usage,  'DEPTH_BUFFER');

        // ensure that the width and height are both valid.
        if (args.width  < 1) args.width  = 1;
        if (args.height < 1) args.height = 1;

        // now cache everything on the renderbuffer instance.
        this.subType = ResourceSubType[args.usage];
        this.format  = args.format;
        this.width   = args.width;
        this.height  = args.height;
        return true;
    };

    /// @summary Creates the backing WebGLRenderbuffer object.
    /// @param gl The WebGLRenderingContext.
    /// @param debug An optional WebGL.Emitter object used for debug reporting.
    /// @return true if the WebGL resources were created successfully.
    Renderbuffer.prototype.createBackingResources = function (gl, debug)
    {
        if (!this.isBacked)
        {
            var  GL     = WebGLConstants;
            var  width  = this.width;
            var  height = this.height;
            var  format = GL[this.format];
            var  target = gl.RENDERBUFFER;
            var  active = gl.getParameter(gl.RENDERBUFFER_BINDING);
            var  buffer = gl.createRenderbuffer();
            if (!buffer)  return false;
            gl.bindRenderbuffer(target, buffer);
            gl.renderbufferStorage(target, format, width, height);
            gl.bindRenderbuffer(target, active);
            this.renderbuffer = buffer;
            this.isBacked     = true;
        }
        return this.isBacked;
    };

    /// @summary Destroys the backing WebGLRenderbuffer object.
    /// @param gl The WebGLRenderingContext.
    /// @return The Renderbuffer.
    Renderbuffer.prototype.deleteBackingResources = function (gl)
    {
        if (this.isBacked)
        {
            if (gl && !gl.isContextLost())
            {
                gl.deleteRenderbuffer(this.renderbuffer);
            }
            this.renderbuffer = null;
            this.isBacked     = false;
        }
        return this;
    };

    /// @summary Constructor function for a type representing a WebGL
    /// framebuffer resource (a render target).
    /// @return A reference to the new Framebuffer instance.
    var Framebuffer = function ()
    {
        if (!(this instanceof Framebuffer))
            return new Framebuffer();

        this.type          = ResourceType.FRAME_BUFFER;
        this.subType       = ResourceSubType.RENDER_TARGET;
        this.isBacked      = false;
        this.framebuffer   = null;
        this.depthBuffer   = null;
        this.stencilBuffer = null;
        this.colorBuffers  = new Array(16);
        this.drawBuffers   = [];
        this.width         = 0;
        this.height        = 0;
        return this;
    };

    /// @summary Serializes the current contents of the instance into an object
    /// that can be passed to Framebuffer.specifyAttributes() to restore state.
    /// @return An object with the same fields expected on the args argument of
    /// the Framebuffer.specifyAttributes() function.
    Framebuffer.prototype.serialize = function ()
    {
        return {
            width  : this.width,
            height : this.height
        };
    };

    /// @summary Specifies the creation attributes of the framebuffer.
    /// @param args An object specifying creation attributes for the resource.
    /// @param args.width The width of the framebuffer, in pixels.
    /// @param args.height The height of the framebuffer, in pixels.
    /// @return true if the creation attributes were validated and stored.
    Framebuffer.prototype.specifyAttributes = function (args)
    {
        var def = function (value, default_value)
            {
                if (value !== undefined)
                    return value;
                else
                    return default_value;
            };

        // ensure that all required arguments are specified.
        args        = args || {};
        args.width  = def(args.width , 1);
        args.height = def(args.height, 1);

        // ensure that the width and height are both valid.
        if (args.width  < 1) args.width  = 1;
        if (args.height < 1) args.height = 1;

        // now cache everything on the framebuffer instance.
        this.width  = args.width;
        this.height = args.height;
        return true;
    };

    /// @summary Creates the backing WebGLFramebuffer object.
    /// @param gl The WebGLRenderingContext.
    /// @param debug An optional WebGL.Emitter object used for debug reporting.
    /// @return true if the WebGL resources were created successfully.
    Framebuffer.prototype.createBackingResources = function (gl, debug)
    {
        if (!this.isBacked)
        {
            var  buffer = gl.createFramebuffer();
            if (!buffer)  return false;
            this.framebuffer = buffer;
            this.isBacked    = true;
        }
        return this.isBacked;
    };

    /// @summary Destroys the backing WebGLRenderbuffer object.
    /// @param gl The WebGLRenderingContext.
    /// @return The Framebuffer.
    Framebuffer.prototype.deleteBackingResources = function (gl)
    {
        if (this.isBacked)
        {
            if (gl && !gl.isContextLost())
            {
                this.detach(); // textures & renderbuffers
                gl.deleteFramebuffer(this.framebuffer);
            }
            for (var i = 0,  n = this.colorBuffers.length; i < n; ++i)
                this.colorBuffers[i]  = null;
            this.stencilBuffer = null;
            this.depthBuffer   = null;
            this.framebuffer   = null;
            this.drawBuffers   = [];
            this.isBacked      = false;
        }
        return this;
    };

    /// @summary Attaches a texture (either a standard 2D texture or cube map)
    /// to the color buffer attachment point associated with the framebuffer.
    /// @param gl The WebGLRenderingContext.
    /// @param resource The Texture to attach.
    /// @param index The zero-based index of the color attachment point. If
    /// unspecified, defaults to zero. Not all implementations support multiple
    /// color attachment points.
    /// @return The Framebuffer.
    Framebuffer.prototype.attachColorTexture = function (gl, resource, index)
    {
        if (index === undefined)
            index   = 0;
        this.colorBuffers[index]  = resource;
        if (gl.TEXTURE_CUBE_MAP === resource.bindTarget)
        {
            // a cube map needs to have all six faces attached.
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            for (var i = 0; i < 6; ++i)
            {
                gl.framebufferTexture2D(
                    gl.FRAMEBUFFER,
                    gl.COLOR_ATTACHMENT0 + index,
                    gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
                    resource.texture, 0);
            }
        }
        else
        {
            // a standard 2D texture map.
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER,
                gl.COLOR_ATTACHMENT0 + index,
                resource.textureTarget,
                resource.texture, 0);
        }
        this.drawBuffers.push(WebGLConstants.DRAW_BUFFER0_WEBGL + index);
        return this;
    };

    /// @summary Attaches a renderbuffer to the color buffer attachment point.
    /// @param gl The WebGLRenderingContext.
    /// @param resource The Renderbuffer to attach.
    /// @param index The zero-based index of the color attachment point. If
    /// unspecified, defaults to zero. Not all implementations support multiple
    /// color attachment points.
    /// @return The Framebuffer.
    Framebuffer.prototype.attachColorRenderbuffer = function (gl, resource, index)
    {
        if (index === undefined)
            index   = 0;
        this.colorBuffers[index] = resource;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.framebufferRenderbuffer(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0 + index,
            gl.RENDERBUFFER,
            resource.renderbuffer);
        this.drawBuffers.push(WebGLConstants.DRAW_BUFFER0_WEBGL + index);
        return this;
    };

    /// @summary Attaches a 2D texture to the depth buffer attachment point.
    /// @param gl The WebGLRenderingContext.
    /// @param resource The Texture to attach.
    /// @return The Framebuffer.
    Framebuffer.prototype.attachDepthTexture = function (gl, resource)
    {
        this.depthBuffer = resource;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.DEPTH_ATTACHMENT,
            gl.TEXTURE_2D,
            resource.texture, 0);
        return this;
    };

    /// @summary Attaches a renderbuffer to the depth buffer attachment point.
    /// @param gl The WebGLRenderingContext.
    /// @param resource The Renderbuffer to attach.
    /// @return The Framebuffer.
    Framebuffer.prototype.attachDepthRenderbuffer = function (gl, resource)
    {
        this.depthBuffer = resource;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.framebufferRenderbuffer(
            gl.FRAMEBUFFER,
            gl.DEPTH_ATTACHMENT,
            gl.RENDERBUFFER,
            resource.renderbuffer);
        return this;
    };

    /// @summary Attaches a renderbuffer to the stencil buffer attachment point.
    /// @param gl The WebGLRenderingContext.
    /// @param resource The Renderbuffer to attach.
    /// @return The Framebuffer.
    Framebuffer.prototype.attachStencilRenderbuffer = function (gl, resource)
    {
        this.stencilBuffer = resource;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.framebufferRenderbuffer(
            gl.FRAMEBUFFER,
            gl.STENCIL_ATTACHMENT,
            gl.RENDERBUFFER,
            resource.renderbuffer);
        return this;
    };

    /// @summary Attaches a 2D texture to the DEPTH_STENCIL attachment point.
    /// @param gl The WebGLRenderingContext.
    /// @param resource The Texture to attach (type UNSIGNED_INT_24_8_WEBGL).
    /// @return The Framebuffer.
    Framebuffer.prototype.attachDepthStencilTexture = function (gl, resource)
    {
        this.depthBuffer   = resource;
        this.stencilBuffer = resource;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.DEPTH_STENCIL_ATTACHMENT,
            gl.TEXTURE_2D,
            resource.texture, 0);
        return this;
    };

    /// @summary Attaches a renderbuffer to the DEPTH_STENCIL attachment point.
    /// @param gl The WebGLRenderingContext.
    /// @param resource The Renderbuffer to attach.
    /// @return The Framebuffer.
    Framebuffer.prototype.attachDepthStencilRenderbuffer = function (gl, resource)
    {
        this.depthBuffer   = resource;
        this.stencilBuffer = resource;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.framebufferRenderbuffer(
            gl.FRAMEBUFFER,
            gl.DEPTH_STENCIL_ATTACHMENT,
            gl.RENDERBUFFER,
            resource.renderbuffer);
        return this;
    };

    /// @summary Detaches resources from all assigned attachment points. This
    /// function is called during Framebuffer.deleteBackingResources() prior
    /// to deleting the WebGLFramebuffer object.
    /// @param gl The WebGLRenderingContext.
    /// @return The Framebuffer.
    Framebuffer.prototype.detach = function (gl)
    {
        var cleanup = function (attach, res)
            {
                if (res === null) return;
                if (res.type ===  ResourceType.TEXTURE)
                {
                    if (res.bindTarget === gl.TEXTURE_CUBE_MAP)
                    {
                        for (var i = 0; i < 6; ++i)
                        {
                            gl.framebufferTexture2D(
                                gl.FRAMEBUFFER, attach,
                                gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, null, 0);
                        }
                    }
                    else
                    {
                        gl.framebufferTexture2D(
                            gl.FRAMEBUFFER, attach,
                            gl.TEXTURE_2D, null, 0);
                    }
                }
                if (res.type ===  ResourceType.RENDER_BUFFER)
                {
                    gl.framebufferRenderbuffer(
                        gl.FRAMEBUFFER, attach,
                        gl.RENDERBUFFER, null);
                }
            };

        for (var i = 0,  n = this.colorBuffers.length; i < n; ++i)
        {
            cleanup(gl.COLOR_ATTACHMENT0 + i, this.colorBuffers[i]);
            this.colorBuffers[i] = null;
        }
        if (this.depthBuffer || this.stencilBuffer)
        {
            if (this.depthBuffer === this.stencilBuffer)
            {
                // a single DEPTH_STENCIL attachment.
                cleanup(gl.DEPTH_STENCIL_ATTACHMENT, this.depthBuffer);
                this.depthBuffer   = null;
                this.stencilBuffer = null;
            }
            else
            {
                // separate depth and stencil attachments.
                cleanup(gl.DEPTH_ATTACHMENT,   this.depthBuffer);
                cleanup(gl.STENCIL_ATTACHMENT, this.stencilBuffer);
                this.depthBuffer   = null;
                this.stencilBuffer = null;
            }
        }
        this.drawBuffers.length = 0;
        return this;
    };

    /// @summary Constructor function for a type storing values for all render
    /// states associated with alpha blending.
    /// @return A reference to the new BlendState instance.
    var BlendState = function ()
    {
        if (!(this instanceof BlendState))
            return new BlendState();

        this.type              = ResourceType.STATE_OBJECT;
        this.subType           = ResourceSubType.BLEND_STATE;
        this.blendEnabled      = false;
        this.constantColor     = [0.0, 0.0, 0.0, 0.0];
        this.sourceFactorColor = WebGLConstants.ONE;
        this.sourceFactorAlpha = WebGLConstants.ONE;
        this.targetFactorColor = WebGLConstants.ZERO;
        this.targetFactorAlpha = WebGLConstants.ZERO;
        this.functionColor     = WebGLConstants.FUNC_ADD;
        this.functionAlpha     = WebGLConstants.FUNC_ADD;
        return this;
    };

    /// @summary Serializes the current contents of the instance into an object
    /// that can be passed to BlendState.specifyAttributes() to restore state.
    /// @return An object with the same fields expected on the args argument of
    /// the BlendState.specifyAttributes() function.
    BlendState.prototype.serialize = function ()
    {
        return {
            blendEnabled      : this.blendEnabled,
            constantColor     : this.constantColor.slice(0),
            sourceFactorColor : enumraw(this.sourceFactorColor),
            sourceFactorAlpha : enumraw(this.sourceFactorAlpha),
            targetFactorColor : enumraw(this.targetFactorColor),
            targetFactorAlpha : enumraw(this.targetFactorAlpha),
            functionColor     : enumraw(this.functionColor),
            functionAlpha     : enumraw(this.functionAlpha)
        };
    };

    /// @summary Specifies the creation attributes of the blend state.
    /// @param args An object specifying creation attributes for the resource.
    /// @param args.blendEnabled Boolean value controlling whether alpha
    /// blending is enabled.
    /// @param args.constantColor An array of four floating point values
    /// specifying the constant RGBA color used for blending and used when the
    /// CONSTANT_COLOR, ONE_MINUS_CONSTANT_COLOR, ONE_MINUS_CONSTANT_ALPHA or
    /// CONSTANT_ALPHA factors are specified.
    /// @param args.sourceFactorColor A string value specifying the contribution
    /// of the source RGB color. May be one of the values ZERO, ONE, SRC_COLOR,
    /// ONE_MINUS_SRC_COLOR, DST_COLOR, ONE_MINUS_DST_COLOR, DST_ALPHA,
    /// ONE_MINUS_DST_ALPHA, CONSTANT_COLOR, ONE_MINUS_CONSTANT_COLOR,
    /// CONSTANT_ALPHA, ONE_MINUS_CONSTANT_ALPHA or SRC_ALPHA_SATURATE.
    /// @param args.sourceFactorAlpha May be any of the values listed above.
    /// @param args.targetFactorColor May be any of the values listed above
    /// except for SRC_ALPHA_SATURATE.
    /// @param args.targetFactorAlpha May be any of the values listed above
    /// except for SRC_ALPHA_SATURATE.
    /// @param args.functionColor The blending function for color channels. May
    /// be one of FUNC_ADD, FUNC_SUBTRACT or FUNC_REVERSE_SUBTRACT.
    /// @param args.functionAlpha The blending function for the alpha channel.
    /// May be any of the values listed above.
    /// @return true if the creation attributes were validated and stored.
    BlendState.prototype.specifyAttributes = function (args)
    {
        var def = function (value, default_value)
            {
                if (value !== undefined)
                    return value;
                else
                    return default_value;
            };

        // ensure that all required arguments are specified.
        args = args || {};
        args.blendEnabled      = def(args.blendEnabled, false);
        args.constantColor     = def(args.constantColor, [0.0, 0.0, 0.0, 0.0]);
        args.sourceFactorColor = def(args.sourceFactorColor, 'ONE');
        args.sourceFactorAlpha = def(args.sourceFactorAlpha, 'ONE');
        args.targetFactorColor = def(args.targetFactorColor, 'ZERO');
        args.targetFactorAlpha = def(args.targetFactorAlpha, 'ZERO');
        args.functionColor     = def(args.functionColor, 'FUNC_ADD');
        args.functionAlpha     = def(args.functionAlpha, 'FUNC_ADD');

        // convert string values to their corresponding enum value.
        var GL = WebGLConstants;
        this.blendEnabled      = args.blendEnabled;
        this.constantColor     = args.constantColor;
        this.sourceFactorColor = GL[args.sourceFactorColor];
        this.sourceFactorAlpha = GL[args.sourceFactorAlpha];
        this.targetFactorColor = GL[args.targetFactorColor];
        this.targetFactorAlpha = GL[args.targetFactorAlpha];
        this.functionColor     = GL[args.functionColor];
        this.functionAlpha     = GL[args.functionAlpha];
        return true;
    };

    /// @summary Creates any backing WebGL resources.
    /// @param gl The WebGLRenderingContext.
    /// @param debug An optional WebGL.Emitter object used for debug reporting.
    /// @return true if the WebGL resources were created successfully.
    BlendState.prototype.createBackingResources = function (gl, debug)
    {
        return true; // nothing to do for this type
    };

    /// @summary Destroys any backing WebGL resources.
    /// @param gl The WebGLRenderingContext.
    /// @return The BlendState.
    BlendState.prototype.deleteBackingResources = function (gl)
    {
        return this; // nothing to do for this type
    };

    /// @summary Constructor function for a type storing the clear values and 
    /// information on which buffers to clear for a given render target.
    /// @return A reference to the new ClearState instance.
    var ClearState = function ()
    {
        if (!(this instanceof ClearState))
            return new ClearState();

        this.type         = ResourceType.STATE_OBJECT;
        this.subType      = ResourceSubType.CLEAR_STATE;
        this.clearColor   = true;
        this.clearDepth   = true;
        this.clearStencil = true;
        this.colorValue   = [0.0, 0.0, 0.0, 0.0];
        this.depthValue   =  1.0;
        this.stencilValue =  0;
        this.clearFlags   =  0;
        return this;
    };

    /// @summary Serializes the current contents of the instance into an object
    /// that can be passed to ClearState.specifyAttributes() to restore state.
    /// @return An object with the same fields expected on the args argument of
    /// the ClearState.specifyAttributes() function.
    ClearState.prototype.serialize = function ()
    {
        return {
            clearColor     : this.clearColor, 
            clearDepth     : this.clearDepth, 
            clearStencil   : this.clearStencil, 
            colorValue     : this.colorValue.splice(0), 
            depthValue     : this.depthValue, 
            stencilValue   : this.stencilValue
        };
    };

    /// @summary Specifies the creation attributes of the clear state.
    /// @param args An object specifying creation attributes for the resource.
    /// @param args.clearColor true to clear the color buffer to the RGBA value
    /// indicated by @a args.colorValue.
    /// @param args.clearDepth true to clear the depth buffer to the depth 
    /// value indicated by @a args.depthValue.
    /// @param args.clearStencil true to clear the stencil buffer to the value 
    /// indicated by @a args.stencilValue.
    /// @param args.colorValue An array of four Number values, each in [0, 1] 
    /// and specifying the clear values for the RGBA color channels. The clear
    /// color defaults to transparent black (all values are 0.)
    /// @param args.depthValue The depth buffer clear value. Defaults to 1.0.
    /// @param args.stencilValue The stencil buffer clear value. Defaults to 0.
    /// @return true if the creation attributes were validated and stored.
    ClearState.prototype.specifyAttributes = function (args)
    {
        var def = function (value, default_value)
            {
                if (value !== undefined)
                    return value;
                else
                    return default_value;
            };

        // ensure that all required arguments are specified.
        args = args || {};
        args.clearColor   = def(args.clearColor,   true);
        args.clearDepth   = def(args.clearDepth,   true);
        args.clearStencil = def(args.clearStencil, true);
        args.colorValue   = def(args.colorValue,   [0.0, 0.0, 0.0, 0.0]);
        args.depthValue   = def(args.depthValue,    0.0);
        args.stencilValue = def(args.stencilValue,    0);

        // convert string values to their corresponding enum value.
        var GL            = WebGLConstants;
        var flags         = 0;
        this.clearColor   = args.clearColor;
        this.clearDepth   = args.clearDepth;
        this.clearStencil = args.clearStencil;
        this.colorValue   = args.colorValue.splice(0);
        this.depthValue   = args.depthValue;
        this.stencilValue = args.stencilValue;
        if (args.clearColor)   flags |= GL.COLOR_BUFFER_BIT;
        if (args.clearDepth)   flags |= GL.DEPTH_BUFFER_BIT;
        if (args.clearStencil) flags |= GL.STENCIL_BUFFER_BIT;
        this.clearFlags      = flags;
        return true;
    };

    /// @summary Creates any backing WebGL resources.
    /// @param gl The WebGLRenderingContext.
    /// @param debug An optional WebGL.Emitter object used for debug reporting.
    /// @return true if the WebGL resources were created successfully.
    ClearState.prototype.createBackingResources = function (gl, debug)
    {
        return true; // nothing to do for this type
    };

    /// @summary Destroys any backing WebGL resources.
    /// @param gl The WebGLRenderingContext.
    /// @return The ClearState.
    ClearState.prototype.deleteBackingResources = function (gl)
    {
        return this; // nothing to do for this type
    };

    /// @summary Constructor function for a type storing values for all render
    /// states associated with rasterization.
    /// @return A reference to the new RasterState instance.
    var RasterState = function ()
    {
        if (!(this instanceof RasterState))
            return new RasterState();

        this.type                  = ResourceType.STATE_OBJECT;
        this.subType               = ResourceSubType.RASTER_STATE;
        this.colorWrite            = [true, true, true, true];
        this.cullingEnabled        = false;
        this.cullFace              = WebGLConstants.BACK;
        this.windingOrder          = WebGLConstants.CCW;
        this.scissorTestEnabled    = false;
        this.scissorX              = 0;
        this.scissorY              = 0;
        this.scissorWidth          = 0;
        this.scissorHeight         = 0;
        this.lineWidth             = 1.0;
        this.offsetFactor          = 0.0;
        this.offsetUnits           = 0.0;
        this.sampleCoverageEnabled = false;
        this.sampleAlphaToCoverage = false;
        this.invertCoverage        = false;
        this.coverageValue         = 1.0;
        return this;
    };

    /// @summary Serializes the current contents of the instance into an object
    /// that can be passed to RasterState.specifyAttributes() to restore state.
    /// @return An object with the same fields expected on the args argument of
    /// the RasterState.specifyAttributes() function.
    RasterState.prototype.serialize = function ()
    {
        return {
            colorWrite            : this.colorWrite.slice(0),
            cullingEnabled        : this.cullingEnabled,
            cullFace              : enumraw(this.cullFace),
            windingOrder          : enumraw(this.windingOrder),
            scissorTestEnabled    : this.scissorTestEnabled,
            scissorX              : this.scissorX,
            scissorY              : this.scissorY,
            scissorWidth          : this.scissorWidth,
            scissorHeight         : this.scissorHeight,
            lineWidth             : this.lineWidth,
            offsetFactor          : this.offsetFactor,
            offsetUnits           : this.offsetUnits,
            sampleCoverageEnabled : this.sampleCoverageEnabled,
            sampleAlphaToCoverage : this.sampleAlphaToCoverage,
            invertCoverage        : this.invertCoverage,
            coverageValue         : this.coverageValue
        };
    };

    /// @summary Specifies the creation attributes of the raster state. See:
    /// http://www.opengl.org/archives/resources/faq/technical/polygonoffset.htm
    /// http://www.khronos.org/opengles/sdk/1.1/docs/man/glSampleCoverage.xml
    /// @param args An object specifying creation attributes for the resource.
    /// @param args.colorWrite An array of four boolean values indicating 
    /// whether data should be written to the RGBA color channels, respectively.
    /// @param args.cullingEnabled true if backface culling is enabled.
    /// @param args.cullFace A string specifying which side of the triangle 
    /// should be culled, one of FRONT or BACK. The default is BACK.
    /// @param args.windingOrder A string specifying the winding order for 
    /// front-facing triangles, one of CW or CCW. The default is CCW.
    /// @param args.scissorTestEnabled true if scissor box testing is enabled.
    /// @param args.scissorX The x-coordinate of the upper-left corner of the 
    /// scissor rectangle.
    /// @param args.scissorY The y-coordinate of the upper-left corner of the 
    /// scissor rectangle.
    /// @param args.scissorWidth The width of the scissor rectangle.
    /// @param args.scissorHeight The height of the scissor rectangle.
    /// @param args.lineWidth The width of a line, in pixels. Support for 
    /// values greater than 1.0 is implementation-specific. The default is 1.0.
    /// @param args.offsetFactor The polygon offset factor. The default is 0.0.
    /// @param args.offsetUnits The polygon offset units. The default is 0.0.
    /// @param args.sampleCoverageEnabled true to enable coverage computation.
    /// @param args.sampleAlphaToCoverage true to scale sampled alpha values by
    /// the computed coverage.
    /// @param args.invertCoverage true to invert sample coverage.
    /// @param args.coverageValue The alpha coverage value. Default is 1.0.
    /// @return true if the creation attributes were validated and stored.
    RasterState.prototype.specifyAttributes = function (args)
    {
        var def = function (value, default_value)
            {
                if (value !== undefined)
                    return value;
                else
                    return default_value;
            };

        // ensure that all required arguments are specified.
        args = args || {};
        args.colorWrite            = def(args.colorWrite, [true, true, true, true])
        args.cullingEnabled        = def(args.cullingEnabled, false);
        args.cullFace              = def(args.cullFace, 'BACK');
        args.windingOrder          = def(args.windingOrder, 'CCW');
        args.scissorTestEnabled    = def(args.scissorTestEnabled, false);
        args.scissorX              = def(args.scissorX, 0);
        args.scissorY              = def(args.scissorY, 0);
        args.scissorWidth          = def(args.scissorWidth, 0);
        args.scissorHeight         = def(args.scissorHeight, 0);
        args.lineWidth             = def(args.lineWidth, 1.0);
        args.offsetFactor          = def(args.offsetFactor, 0.0);
        args.offsetUnits           = def(args.offsetUnits, 0.0);
        args.sampleCoverageEnabled = def(args.sampleCoverageEnabled, false);
        args.sampleAlphaToCoverage = def(args.sampleAlphaToCoverage, false);
        args.invertCoverage        = def(args.invertCoverage, false);
        args.coverageValue         = def(args.coverageValue, 1.0);

        // convert string values to their corresponding enum value.
        var GL = WebGLConstants;
        this.colorWrite            = args.colorWrite.splice(0);
        this.cullingEnabled        = args.cullingEnabled;
        this.cullFace              = GL[args.cullFace];
        this.windingOrder          = GL[args.windingOrder];
        this.scissorTestEnabled    = args.scissorTestEnabled;
        this.scissorX              = args.scissorX;
        this.scissorY              = args.scissorY;
        this.scissorWidth          = args.scissorWidth;
        this.scissorHeight         = args.scissorHeight;
        this.lineWidth             = args.lineWidth;
        this.offsetFactor          = args.offsetFactor;
        this.offsetUnits           = args.offsetUnits;
        this.sampleCoverageEnabled = args.sampleCoverageEnabled;
        this.sampleAlphaToCoverage = args.sampleAlphaToCoverage;
        this.invertCoverage        = args.invertCoverage;
        this.coverageValue         = args.coverageValue;
        return true;
    };

    /// @summary Creates any backing WebGL resources.
    /// @param gl The WebGLRenderingContext.
    /// @param debug An optional WebGL.Emitter object used for debug reporting.
    /// @return true if the WebGL resources were created successfully.
    RasterState.prototype.createBackingResources = function (gl, debug)
    {
        return true; // nothing to do for this type
    };

    /// @summary Destroys any backing WebGL resources.
    /// @param gl The WebGLRenderingContext.
    /// @return The RasterState.
    RasterState.prototype.deleteBackingResources = function (gl)
    {
        return this; // nothing to do for this type
    };

    /// @summary Constructor function for a type storing values for all render
    /// states associated with depth and stencil testing.
    /// @return A reference to the new DepthStencilState instance.
    var DepthStencilState = function ()
    {
        if (!(this instanceof DepthStencilState))
            return DepthStencilState();

        this.type                    = ResourceType.STATE_OBJECT;
        this.subType                 = ResourceSubType.DEPTH_STENCIL_STATE;
        this.depthWriteEnabled       = true;
        this.depthTestEnabled        = false;
        this.depthTestFunction       = WebGLConstants.LESS;
        this.stencilTestEnabled      = false;
        this.stencilMaskBack         = 0xFFFFFFFF;
        this.stencilReferenceBack    = 0;
        this.stencilFunctionBack     = WebGLConstants.ALWAYS;
        this.stencilFailOpBack       = WebGLConstants.KEEP;
        this.stencilPassZFailOpBack  = WebGLConstants.KEEP;
        this.stencilPassZPassOpBack  = WebGLConstants.KEEP;
        this.stencilMaskFront        = 0xFFFFFFFF;
        this.stencilReferenceFront   = 0;
        this.stencilFunctionFront    = WebGLConstants.ALWAYS;
        this.stencilFailOpFront      = WebGLConstants.KEEP;
        this.stencilPassZFailOpFront = WebGLConstants.KEEP;
        this.stencilPassZPassOpFront = WebGLConstants.KEEP;
        return this;
    };

    /// @summary Serializes the current contents of the instance into an object
    /// that can be passed to DepthStencilState.specifyAttributes() to restore.
    /// @return An object with the same fields expected on the args argument of
    /// the DepthStencilState.specifyAttributes() function.
    DepthStencilState.prototype.serialize = function ()
    {
        return {
            depthWriteEnabled       : this.depthWriteEnabled,
            depthTestEnabled        : this.depthTestEnabled, 
            depthTestFunction       : enumraw(this.depthTestFunction),
            stencilTestEnabled      : this.stencilTestEnabled, 
            stencilMaskBack         : this.stencilMaskBack,
            stencilReferenceBack    : this.stencilReferenceBack,
            stencilFunctionBack     : enumraw(this.stencilFunctionBack),
            stencilFailOpBack       : enumraw(this.stencilFailOpBack),
            stencilPassZFailOpBack  : enumraw(this.stencilPassZFailOpBack),
            stencilPassZPassOpBack  : enumraw(this.stencilPassZPassOpBack),
            stencilMaskFront        : this.stencilMaskFront, 
            stencilReferenceFront   : this.stencilReferenceFront, 
            stencilFunctionFront    : enumraw(this.stencilFunctionFront),
            stencilFailOpFront      : enumraw(this.stencilFailOpFront),
            stencilPassZFailOpFront : enumraw(this.stencilPassZFailOpFront),
            stencilPassZPassOpFront : enumraw(this.stencilPassZPassOpFront)
        };
    };

    /// @summary Specifies the creation attributes of the render state.
    /// @param args An object specifying creation attributes for the resource.
    /// @param args.depthWriteEnabled true to write depth values.
    /// @param args.depthTestEnabled true to enable depth testing.
    /// @param args.depthTestFunction A string specifying the function to use 
    /// when comparing depth values, one of NEVER, EQUAL, LESS, LEQUAL, 
    /// GREATER, GEQUAL, NOTEQUAL or ALWAYS. The default is LESS.
    /// @param args.stencilTestEnabled true to enable stencil testing.
    /// @param args.stencilMaskBack A 32-bit unsigned integer value specifying
    /// the stencil mask value for back-facing triangles.
    /// @param args.stencilReferenceBack An 8-bit unsigned integer value 
    /// specifying the reference value for back-facing triangles.
    /// @param args.stencilFunctionBack A string specifying the function to use
    /// when comparing stencil values for back-facing triangles. May have the 
    /// same values as @a args.depthTestFunction. The default is ALWAYS.
    /// @param args.stencilFailOpBack A string specifying the operation to 
    /// perform when the stencil test fails for back-facing triangles, one of 
    /// KEEP, ZERO, REPLACE, INCR, INCR_WRAP, DECR, DECR_WRAP or INVERT. The 
    /// default is KEEP.
    /// @param args.stencilPassZFailOpBack A string specifying the operation to
    /// perform when the stencil test passes, but the depth test fails. The 
    /// default is KEEP.
    /// @param args.stencilPassZPassOpBack A string specifying the operation to 
    /// perform when both the stencil and depth tests pass. The default is KEEP.
    /// @param args.stencilMaskFront A 32-bit unsigned integer value specifying
    /// the stencil mask value for front-facing triangles.
    /// @param args.stencilReferenceFront An 8-bit unsigned integer value 
    /// specifying the reference value for front-facing triangles.
    /// @param args.stencilFunctionFront A string specifying the function to use
    /// when comparing stencil values for front-facing triangles. May have the 
    /// same values as @a args.depthTestFunction. The default is ALWAYS.
    /// @param args.stencilFailOpFront A string specifying the operation to 
    /// perform when the stencil test fails for front-facing triangles, one of 
    /// KEEP, ZERO, REPLACE, INCR, INCR_WRAP, DECR, DECR_WRAP or INVERT. The 
    /// default is KEEP.
    /// @param args.stencilPassZFailOpFront A string specifying the operation 
    /// to perform when the stencil test passes, but the depth test fails. The 
    /// default is KEEP.
    /// @param args.stencilPassZPassOpFront A string specifying the operation to 
    /// perform when both the stencil and depth tests pass. The default is KEEP.
    /// @return true if the creation attributes were validated and stored.
    DepthStencilState.prototype.specifyAttributes = function (args)
    {
        var def = function (value, default_value)
            {
                if (value !== undefined)
                    return value;
                else
                    return default_value;
            };

        // ensure that all required arguments are specified.
        args = args || {};
        args.depthWriteEnabled       = def(args.depthWriteEnabled, true);
        args.depthTestEnabled        = def(args.depthTestEnabled, false);
        args.depthTestFunction       = def(args.depthTestFunction, 'LESS');
        args.stencilTestEnabled      = def(args.stencilTestEnabled, false);
        args.stencilMaskBack         = def(args.stencilMaskBack, 0xFFFFFFFF);
        args.stencilReferenceBack    = def(args.stencilReferenceBack, 0);
        args.stencilFunctionBack     = def(args.stencilFunctionBack, 'ALWAYS');
        args.stencilFailOpBack       = def(args.stencilFailOpBack, 'KEEP');
        args.stencilPassZFailOpBack  = def(args.stencilPassZFailOpBack, 'KEEP');
        args.stencilPassZPassOpBack  = def(args.stencilPassZPassOpBack, 'KEEP');
        args.stencilMaskFront        = def(args.stencilMaskFront, 0xFFFFFFFF);
        args.stencilReferenceFront   = def(args.stencilReferenceFront, 0);
        args.stencilFunctionFront    = def(args.stencilFunctionFront, 'ALWAYS');
        args.stencilFailOpFront      = def(args.stencilFailOpFront, 'KEEP');
        args.stencilPassZFailOpFront = def(args.stencilPassZFailOpFront, 'KEEP');
        args.stencilPassZPassOpFront = def(args.stencilPassZPassOpFront, 'KEEP');

        // convert string values to their corresponding enum value.
        var GL = WebGLConstants;
        this.depthWriteEnabled       = args.depthWriteEnabled;
        this.depthTestEnabled        = args.depthTestEnabled;
        this.depthTestFunction       = GL[args.depthTestFunction];
        this.stencilTestEnabled      = args.stencilTestEnabled;
        this.stencilMaskBack         = args.stencilMaskBack;
        this.stencilReferenceBack    = args.stencilReferenceBack;
        this.stencilFunctionBack     = GL[args.stencilFunctionBack];
        this.stencilFailOpBack       = GL[args.stencilFailOpBack];
        this.stencilPassZFailOpBack  = GL[args.stencilPassZFailOpBack];
        this.stencilPassZPassOpBack  = GL[args.stencilPassZPassOpBack];
        this.stencilMaskFront        = args.stencilMaskFront;
        this.stencilReferenceFront   = args.stencilReferenceFront;
        this.stencilFunctionFront    = GL[args.stencilFunctionFront];
        this.stencilFailOpFront      = GL[args.stencilFailOpFront];
        this.stencilPassZFailOpFront = GL[args.stencilPassZFailOpFront];
        this.stencilPassZPassOpFront = GL[args.stencilPassZPassOpFront];
        return true;
    };

    /// @summary Creates any backing WebGL resources.
    /// @param gl The WebGLRenderingContext.
    /// @param debug An optional WebGL.Emitter object used for debug reporting.
    /// @return true if the WebGL resources were created successfully.
    DepthStencilState.prototype.createBackingResources = function (gl, debug)
    {
        return true; // nothing to do for this type
    };

    /// @summary Destroys any backing WebGL resources.
    /// @param gl The WebGLRenderingContext.
    /// @return The DepthStencilState.
    DepthStencilState.prototype.deleteBackingResources = function (gl)
    {
        return this; // nothing to do for this type
    };

    /// @summary Constructor function for a type representing the current state
    /// of a WebGLRenderingContext. The DrawContext is used to apply state
    /// changes, bind resources, and set uniforms and constant attribute values.
    /// @return The new DrawContext instance.
    var DrawContext = function ()
    {
        if (!(this instanceof DrawContext))
            return new DrawContext();

        this.drawBuffersWEBGL        = null;
        this.enabledExtensions       = {};
        this.defaultDrawBuffer       = [WebGLConstants.BACK];
        this.activeTextures          = new Array(TextureSlots.length);
        this.activeTextureIndex      = 0;
        this.activeProgram           = null;
        this.activeFramebuffer       = null;
        this.activeArrayBuffer       = null;
        this.activeIndexBuffer       = null;
        this.activeBlendState        = new BlendState();
        this.activeClearState        = new ClearState();
        this.activeRasterState       = new RasterState();
        this.activeDepthStencilState = new DepthStencilState();
        this.activeViewport          = {
            x      : 0,
            y      : 0,
            width  : 1,
            height : 1,
            near   : 0.0,
            far    : 0.0
        };
        return this;
    };

    /// @summary Enables an extension for use in the implementation.
    /// @param gl The WebGLRenderingContext.
    /// @param name The non-prefixed name of the extension to enable.
    /// @return The extension object, or null.
    DrawContext.prototype.enableExtension = function (gl, name)
    {
        var ext = this.enabledExtensions[name];
        if (ext)  return ext;

        // first, try without any vendor prefix.
        ext = gl.getExtension(name);
        if (ext)
        {
            if (name === 'WEBGL_draw_buffers')
                this.drawBuffersWEBGL = ext;
            this.enabledExtensions[name] = ext;
            return ext;
        }

        // try the various vendor-prefixed versions.
        var vendors = ['MOZ_','WEBKIT_','O_','IE_'];
        for (var i  = 0, n = vendors.length; i < n; ++i)
        {
            ext  = gl.getExtension(vendors[i] + name);
            if (ext)
            {
                if (name === 'WEBGL_draw_buffers')
                    this.drawBuffersWEBGL = ext;
                this.enabledExtensions[name] = ext;
                return ext;
            }
        }
        return null;
    };

    /// @summary Enables all extensions supported by the implementation.
    /// @param gl The WebGLRenderingContext.
    /// @return The DrawContext.
    DrawContext.prototype.enableAllExtensions = function (gl)
    {
        var supported = gl.getSupportedExtensions();
        var vendors   = ['MOZ_', 'WEBKIT_', 'O_', 'IE_'];
        for (var  i   = 0, n = supported.length; i < n; ++i)
        {
            var name  = supported[i];
            var ext   = gl.getExtension(name);
            if (ext)
            {
                for (var j = 0, m = vendors.length; j < m; ++j)
                {
                    var prefix = vendors[j];
                    if (name.indexOf(prefix) === 0)
                    {   // chop off the vendor prefix.
                        name = name.substr(prefix.length);
                        break;
                    }
                }
                if (name === 'WEBGL_draw_buffers')
                    this.drawBuffersWEBGL = ext;
                this.enabledExtensions[name] = ext;
            }
        }
        return this;
    };

    /// @summary Retrieves a previously enabled extension definition.
    /// @param gl The WebGLRenderingContext.
    /// @param name The non-prefixed name of the extension to retrieve.
    /// @return The extension object, or null.
    DrawContext.prototype.extension = function (gl, name)
    {
        return this.enabledExtensions[name] || null;
    };

    /// @summary Creates an object specifying the properties of the viewport. A
    /// viewport can be applied using DrawContext.applyViewport().
    /// @return An object specifying the viewport properties.
    /// obj.x The x-coordinate of the upper-left corner of the viewport.
    /// obj.y The y-coordinate of the upper-left corner of the viewport.
    /// obj.width The width of the viewport, in pixels.
    /// obj.height The height of the viewport, in pixels.
    /// obj.near The distance to the near clipping plane.
    /// obj.far The distance to the far clipping plane.
    DrawContext.prototype.createViewport = function (width, height)
    {
        width  = width  || 1;
        height = height || 1;
        return {
            x      : 0,
            y      : 0,
            width  : width,
            height : height,
            near   : 0.0,
            far    : 1.0
        };
    };

    /// @summary Applies a viewport configuration.
    /// @param gl The WebGLRenderingContext.
    /// @param view An object describing the viewport, as returned by the 
    /// DrawContext.createViewport() function.
    /// @return The DrawContext.
    DrawContext.prototype.applyViewport = function (gl, view)
    {
        var vp = this.activeViewport;
        var x  = view.x;
        var y  = view.y;
        var w  = view.width;
        var h  = view.height;
        var n  = view.near;
        var f  = view.far;

        if (vp.x !== x || vp.y !== y || vp.width !== w || vp.height !== h)
        {
            gl.viewport(x, y, w, h);
            vp.x      = x;
            vp.y      = y;
            vp.width  = w;
            vp.height = h;
        }
        if (vp.near !== n || vp.far !== f)
        {
            gl.depthRange(n, f);
            vp.near   = n;
            vp.far    = f;
        }
        return this;
    };

    /// @summary Applies an alpha blending state.
    /// @param gl The WebGLRenderingContext.
    /// @param state The BlendState resource.
    /// @return The DrawContext.
    DrawContext.prototype.applyBlendState = function (gl, state)
    {
        var active = this.activeBlendState;
        if (active.blendEnabled !== state.blendEnabled)
        {
            if (state.blendEnabled) gl.enable(gl.BLEND);
            else gl.disable(gl.BLEND);
            active.blendEnabled = state.blendEnabled;
        }

        if (active.functionColor !== state.functionColor ||
            active.functionAlpha !== state.functionAlpha)
        {
            gl.blendEquationSeparate(state.functionColor, state.functionAlpha);
            active.functionColor = state.functionColor;
            active.functionAlpha = state.functionAlpha;
        }

        if (active.sourceFactorColor !== state.sourceFactorColor ||
            active.sourceFactorAlpha !== state.sourceFactorAlpha ||
            active.targetFactorColor !== state.targetFactorColor ||
            active.targetFactorAlpha !== state.targetFactorAlpha)
        {
            gl.blendFuncSeparate(state.sourceFactorColor, state.targetFactorColor, state.sourceFactorAlpha, state.targetFactorAlpha);
            active.sourceFactorColor = state.sourceFactorColor;
            active.sourceFactorAlpha = state.sourceFactorAlpha;
            active.targetFactorColor = state.targetFactorColor;
            active.targetFactorAlpha = state.targetFactorAlpha;
        }

        var curColor = active.constantColor;
        var newColor = state.constantColor;
        if (curColor[0] !== newColor[0] ||
            curColor[1] !== newColor[1] ||
            curColor[2] !== newColor[2] ||
            curColor[3] !== newColor[3])
        {
            gl.blendColor(newColor[0], newColor[1], newColor[2], newColor[3]);
            curColor[0] = newColor[0];
            curColor[1] = newColor[1];
            curColor[2] = newColor[2];
            curColor[3] = newColor[3];
        }
        return this;
    };

    /// @summary Applies a render target clear state.
    /// @param gl The WebGLRenderingContext.
    /// @param state The ClearState resource.
    /// @return The DrawContext.
    DrawContext.prototype.applyClearState = function (gl, state)
    {
        var active = this.activeClearState;
        if (active.colorValue[0] !== state.colorValue[0] || 
            active.colorValue[1] !== state.colorValue[1] || 
            active.colorValue[2] !== state.colorValue[2] || 
            active.colorValue[3] !== state.colorValue[3])
        {
            gl.clearColor(state.colorValue[0], state.colorValue[1], state.colorValue[2], state.colorValue[3]);
            active.colorValue[0] = state.colorValue[0];
            active.colorValue[1] = state.colorValue[1];
            active.colorValue[2] = state.colorValue[2];
            active.colorValue[3] = state.colorValue[3];
        }
        if (active.depthValue !== state.depthValue)
        {
            gl.clearDepth(state.depthValue);
            active.depthValue = state.depthValue;
        }
        if (active.stencilValue !== state.stencilValue)
        {
            gl.clearStencil(state.stencilValue);
            active.stencilValue = state.stencilValue;
        }
        active.clearColor   = state.clearColor;
        active.clearDepth   = state.clearDepth;
        active.clearStencil = state.clearStencil;
        active.clearFlags   = state.clearFlags;
        return this;
    };

    /// @summary Applies a rasterizer state.
    /// @param gl The WebGLRenderingContext.
    /// @param state The RasterState resource.
    /// @return The DrawContext.
    DrawContext.prototype.applyRasterState = function (gl, state)
    {
        var active = this.activeRasterState;
        if (active.cullingEnabled !== state.cullingEnabled)
        {
            if (state.cullingEnabled) gl.enable(gl.CULL_FACE);
            else gl.disable(gl.CULL_FACE);
            active.cullingEnabled = state.cullingEnabled;
        }
        if (active.cullFace !== state.cullFace)
        {
            gl.cullFace(state.cullFace);
            active.cullFace = state.cullFace;
        }
        if (active.windingOrder !== state.windingOrder)
        {
            gl.frontFace(state.windingOrder);
            active.windingOrder = state.windingOrder;
        }
        if (active.scissorTestEnabled !== state.scissorTestEnabled)
        {
            if (state.scissorTestEnabled) gl.enable(gl.SCISSOR_TEST);
            else gl.disable(gl.SCISSOR_TEST);
            active.scissorTestEnabled = state.scissorTestEnabled;
        }
        if (active.scissorX      !== state.scissorX     ||
            active.scissorY      !== state.scissorY     ||
            active.scissorWidth  !== state.scissorWidth ||
            active.scissorHeight !== state.scissorHeight)
        {
            gl.scissor(state.scissorX, state.scissorY, state.scissorWidth, state.scissorHeight);
            active.scissorX      = state.scissorX;
            active.scissorY      = state.scissorY;
            active.scissorWidth  = state.scissorWidth;
            active.scissorHeight = state.scissorHeight;
        }
        if (active.offsetFactor !== state.offsetFactor ||
            active.offsetUnits  !== state.offsetUnits)
        {
            gl.polygonOffset(state.offsetFactor, state.offsetUnits);
            active.offsetFactor   = state.offsetFactor;
            active.offsetUnits    = state.offsetUnits;
        }
        if (active.sampleCoverageEnabled !== state.sampleCoverageEnabled)
        {
            if (state.sampleCoverageEnabled) gl.enable(gl.SAMPLE_COVERAGE);
            else gl.disable(gl.SAMPLE_COVERAGE);
            active.sampleCoverageEnabled = state.sampleCoverageEnabled;
        }
        if (active.sampleAlphaToCoverage !== state.sampleAlphaToCoverage)
        {
            if (state.sampleAlphaToCoverage) gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
            else gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE);
            active.sampleAlphaToCoverage = state.sampleAlphaToCoverage;
        }
        if (active.invertCoverage !== state.invertCoverage ||
            active.coverageValue  !== state.coverageValue)
        {
            gl.sampleCoverage(state.coverageValue, state.invertCoverage);
            active.invertCoverage = state.invertCoverage;
            active.coverageValue  = state.coverageValue;
        }
        if (active.lineWidth !== state.lineWidth)
        {
            gl.lineWidth(state.lineWidth);
            active.lineWidth = state.lineWidth;
        }
        if (active.colorWrite[0] !== state.colorWrite[0] ||
            active.colorWrite[1] !== state.colorWrite[1] ||
            active.colorWrite[2] !== state.colorWrite[2] ||
            active.colorWrite[3] !== state.colorWrite[3])
        {
            gl.colorMask(state.colorWrite[0], state.colorWrite[1], state.colorWrite[2], state.colorWrite[3]);
            active.colorWrite[0] = state.colorWrite[0];
            active.colorWrite[1] = state.colorWrite[1];
            active.colorWrite[2] = state.colorWrite[2];
            active.colorWrite[3] = state.colorWrite[3];
        }
        return this;
    };

    /// @summary Applies a state affecting depth and stencil testing.
    /// @param gl The WebGLRenderingContext.
    /// @param state The DepthStencilState resource.
    /// @return The DrawContext.
    DrawContext.prototype.applyDepthStencilState = function (gl, state)
    {
        var active = this.activeDepthStencilState;
        if (active.depthWriteEnabled !== state.depthWriteEnabled)
        {
            gl.depthMask(state.depthWriteEnabled);
            active.depthWriteEnabled = state.depthWriteEnabled;
        }
        if (active.depthTestEnabled !== state.depthTestEnabled)
        {
            if (state.depthTestEnabled) gl.enable(gl.DEPTH_TEST);
            else gl.disable(gl.DEPTH_TEST);
            active.depthTestEnabled = state.depthTestEnabled;
        }
        if (active.depthTestFunction !== state.depthTestFunction)
        {
            gl.depthFunc(state.depthTestFunction);
            active.depthTestFunction = state.depthTestFunction;
        }
        if (active.stencilTestEnabled !== state.stencilTestEnabled)
        {
            if (state.stencilTestEnabled) gl.enable(gl.STENCIL_TEST);
            else gl.disable(gl.STENCIL_TEST);
            active.stencilTestEnabled = state.stencilTestEnabled;
        }
        if (active.stencilMaskBack      !== state.stencilMaskBack     || 
            active.stencilFunctionBack  !== state.stencilFunctionBack ||
            active.stencilReferenceBack !== state.stencilReferenceBack) 
        {
            gl.stencilFuncSeparate(gl.BACK, state.stencilFunctionBack, state.stencilReferenceBack, state.stencilMaskBack);
            active.stencilMaskBack      = state.stencilMaskBack;
            active.stencilFunctionBack  = state.stencilFunctionBack;
            active.stencilReferenceBack = state.stencilReferenceBack;
        }
        if (active.stencilFailOpBack      !== state.stencilFailOpBack      || 
            active.stencilPassZFailOpBack !== state.stencilPassZFailOpBack || 
            active.stencilPassZPassOpBack !== state.stencilPassZPassOpBack)
        {
            gl.stencilOpSeparate(gl.BACK, state.stencilFailOpBack, state.stencilPassZFailOpBack, state.stencilPassZPassOpBack);
            active.stencilFailOpBack      = state.stencilFailOpBack;
            active.stencilPassZFailOpBack = state.stencilPassZFailOpBack;
            active.stencilPassZPassOpBack = state.stencilPassZPassOpBack;
        }
        if (active.stencilMaskFront      !== state.stencilMaskFront     || 
            active.stencilFunctionFront  !== state.stencilFunctionFront ||
            active.stencilReferenceFront !== state.stencilReferenceFront) 
        {
            gl.stencilFuncSeparate(gl.FRONT, state.stencilFunctionFront, state.stencilReferenceFront, state.stencilMaskFront);
            active.stencilMaskFront      = state.stencilMaskFront;
            active.stencilFunctionFront  = state.stencilFunctionFront;
            active.stencilReferenceFront = state.stencilReferenceFront;
        }
        if (active.stencilFailOpFront      !== state.stencilFailOpFront      || 
            active.stencilPassZFailOpFront !== state.stencilPassZFailOpFront || 
            active.stencilPassZPassOpFront !== state.stencilPassZPassOpFront)
        {
            gl.stencilOpSeparate(gl.FRONT, state.stencilFailOpFront, state.stencilPassZFailOpFront, state.stencilPassZPassOpFront);
            active.stencilFailOpFront      = state.stencilFailOpFront;
            active.stencilPassZFailOpFront = state.stencilPassZFailOpFront;
            active.stencilPassZPassOpFront = state.stencilPassZPassOpFront;
        }
        return this;
    };

    /// @summary Applies a scissor rectangle and enables scissor testing if the
    /// rectangle is non-empty.
    /// @param gl The WebGLRenderingContext.
    /// @param x The x-coordinate of the upper-left corner of the rectangle.
    /// @param y The y-coordinate of the upper-left corner of the rectangle.
    /// @param width The width of the scissor region, in pixels.
    /// @param height The height of the scissor region, in pixels.
    /// @return The DrawContext.
    DrawContext.prototype.applyScissorRegion = function (gl, x, y, width, height)
    {
        var active = this.activeRasterState;
        if ((width > 0 || height > 0) && !active.scissorTestEnabled)
        {
            gl.enable(gl.SCISSOR_TEST);
            active.scissorTestEnabled  = true;
        }
        else if (active.scissorTestEnabled)
        {
            gl.disable(gl.SCISSOR_TEST);
            active.scissorTestEnabled  = false;
        }
        if (x      !== active.scissorX     ||
            y      !== active.scissorY     ||
            width  !== active.scissorWidth ||
            height !== active.scissorHeight)
        {
            gl.scissor(x, y, width, height);
            active.scissorX       = x;
            active.scissorY       = y;
            active.scissorWidth   = width;
            active.scissorHeight  = height;
        }
        return this;
    };

    /// @summary Applies new stencil masking values.
    /// @param gl The WebGLRenderingContext.
    /// @param front A 32-bit unsigned integer representing the mask to use for
    /// stencil testing with front-facing triangles.
    /// @param back A 32-bit unsigned integer representing the mask to use for
    /// stencil testing with back-facing triangles.
    /// @return The DrawContext.
    DrawContext.prototype.applyStencilMask = function (gl, front, back)
    {
        var active  = this.activeDepthStencilState;
        if (front !== undefined && back === undefined)
            back    = front;

        if (active.stencilMaskBack !== back)
        {
            gl.stencilMaskSeparate(gl.BACK, back);
            active.stencilMaskBack  = back;
        }
        if (active.stencilMaskFront !== front)
        {
            gl.stencilMaskSeparate(gl.FRONT, front);
            active.stencilMaskFront = front;
        }
        return this;
    };

    /// @summary Enables or disables writing to the color and depth buffers. If
    /// you need fine-grained control over which color channels get written, 
    /// create and apply a RasterState object.
    /// @param gl The WebGLRenderingContext.
    /// @param color true to enable writes to the RGBA color channels.
    /// @param depth true to enable writes to the depth buffer.
    /// @return The DrawContext.
    DrawContext.prototype.applyWriteMasks= function (gl, color, depth)
    {
        var active  = this.activeRasterState;
        if (color !== undefined && depth === undefined)
            depth   = color;

        if (active.colorWrite[0] !== color ||
            active.colorWrite[1] !== color || 
            active.colorWrite[2] !== color || 
            active.colorWrite[3] !== color)
        {
            gl.colorMask(color, color, color, color);
            active.colorWrite[0] = color;
            active.colorWrite[1] = color;
            active.colorWrite[2] = color;
            active.colorWrite[3] = color;
        }
        if (this.activeDepthStencilState.depthWriteEnabled !== depth)
        {
            gl.depthMask(depth);
            this.activeDepthStencilState.depthWriteEnabled = depth;
        }
        return this;
    };

    /// @summary Clears the active framebuffer.
    /// @param gl The WebGLRenderingContext.
    /// @return The DrawContext.
    DrawContext.prototype.clearFramebuffer = function (gl)
    {
        gl.clear(this.activeClearState.clearFlags);
        return this;
    };

    /// @summary Selects a framebuffer for use as the current render target and
    /// enables the associated draw buffers if supported by the implementation.
    /// @param gl The WebGLRenderingContext.
    /// @param resource The Framebuffer representing the resource to bind.
    /// @return The Framebuffer previously bound as the active render target.
    DrawContext.prototype.bindFramebuffer = function (gl, resource)
    {
        var ext   = this.drawBuffersWEBGL;
        var bound = this.activeFramebuffer;
        if (resource)
        {
            if (resource !== bound)
            {
                gl.bindFramebuffer(gl.FRAMEBUFFER, resource.framebuffer);
                if (resource.drawBuffers.length > 1 && ext)
                {
                    ext.drawBuffersWEBGL(resource.drawBuffers);
                }
                else if (ext)
                {
                    ext.drawBuffersWEBGL(this.defaultDrawBuffer);
                }
                this.activeFramebuffer = resource;
            }
        }
        else if (bound)
        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            if (bound.drawBuffers.length > 1 && ext)
            {
                ext.drawBuffersWEBGL(this.defaultDrawBuffer);
            }
            this.activeFramebuffer = null;
        }
        return bound;
    }

    /// @summary Selects an array buffer for use in supplying primitive data.
    /// @param gl The WebGLRenderingContext.
    /// @param resource The Buffer representing the resource to bind.
    /// @return The Buffer previously bound as the array buffer.
    DrawContext.prototype.bindArrayBuffer = function (gl, resource)
    {
        var bound = this.activeArrayBuffer;
        if (resource)
        {
            if (resource !== bound)
            {
                gl.bindBuffer(gl.ARRAY_BUFFER, resource.buffer);
                this.activeArrayBuffer = resource;
            }
        }
        else if (bound)
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            this.activeArrayBuffer = null;
        }
        return bound;
    };

    /// @summary Selects a buffer for use in supplying primitive indices.
    /// @param gl The WebGLRenderingContext.
    /// @param resource The Buffer representing the resource to bind.
    /// @return The Buffer previously bound as the index buffer.
    DrawContext.prototype.bindIndexBuffer = function (gl, resource)
    {
        var bound = this.activeIndexBuffer;
        if (resource)
        {
            if (resource !== bound)
            {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, resource.buffer);
                this.activeIndexBuffer = resource;
            }
        }
        else if (bound)
        {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            this.activeIndexBuffer = null;
        }
        return bound;
    };

    /// @summary Selects a texture unit and binds a texture resource to it.
    /// @param gl The WebGLRenderingContext.
    /// @param resource The Texture representing the resource to bind.
    /// @param unit The zero-based index of the texture unit to which the
    /// texture should be bound. Defaults to the active texture unit.
    /// @return The Texture previously bound to the specified texture unit.
    DrawContext.prototype.bindTexture = function (gl, resource, unit)
    {
        if (unit === undefined)
            unit   = this.activeTextureIndex;
        if (unit !== this.activeTextureIndex)
        {
            gl.activeTexture(gl.TEXTURE0 + unit);
            this.activeTextureIndex = unit;
        }

        var bound = this.activeTextures[unit];
        if (resource)
        {
            if (resource !== bound)
            {
                gl.bindTexture(resource.bindTarget, resource.texture);
                this.activeTextures[unit] = resource;
            }
        }
        else if (bound)
        {
            gl.bindTexture(bound.bindTarget, null);
            this.activeTextures[unit] = null;
        }

        return bound;
    };

    /// @summary Selects a shader program for use during primitive processing.
    /// @param gl The WebGLRenderingContext.
    /// @param resource The Program representing the resource to bind.
    /// @return The Program previously used during primitive processing.
    DrawContext.prototype.bindProgram = function (gl, resource)
    {
        var bound = this.activeProgram;
        if (resource)
        {
            if (resource !== bound)
            {
                gl.useProgram(resource.program);
                resource.boundTextureCount = 0;
                this.activeProgram = resource;
            }
        }
        else if (bound)
        {
            gl.useProgram(null);
            this.activeProgram = null;
        }
        return bound;
    };

    /// @summary Unbinds all resources from the WebGLRenderingContext and
    /// resets the internal bindings. This is typically called in response to
    /// a lost context or when freeing all resources.
    /// @param gl The WebGLRenderingContext.
    /// @return The DrawContext.
    DrawContext.prototype.unbind = function (gl)
    {
        // typically, this is called in response to a lost context,
        // but it's possible that this isn't the case, so unbind all
        // resources on the WebGLRenderingContext.
        if (gl && !gl.isContextLost())
        {
            for (var i = 0, n = TextureSlots.length; i < n; ++i)
            {
                gl.activeTexture(gl.TEXTURE0 + i);
                gl.bindTexture(gl.TEXTURE_2D, null);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
            }
            gl.activeTexture(gl.TEXTURE0);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.useProgram(null);
            var ext = this.drawBuffersWEBGL;
            if (ext)   ext.drawBuffersWEBGL(this.defaultDrawBuffer);
        }

        // always reset the active bindings in our internal state.
        this.activeProgram      = null;
        this.activeFramebuffer  = null;
        this.activeArrayBuffer  = null;
        this.activeIndexBuffer  = null;
        this.activeTextureIndex = 0;
        for (var i = 0, n = TextureSlots.length; i < n; ++i)
            this.activeTextures[i] = null;

        return this;
    };

    /// @summary Unbinds the active framebuffer.
    /// @param gl The WebGLRenderingContext.
    /// @return The Framebuffer bound as the active render target, or null.
    DrawContext.prototype.unbindFramebuffer = function (gl)
    {
        var ext     = this.drawBuffersWEBGL;
        var bound   = this.activeFramebuffer;
        if (bound !== null)
        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            if (bound.drawBuffers.length > 1 && ext)
            {
                ext.drawBuffersWEBGL(this.defaultDrawBuffer);
            }
            this.activeFramebuffer = null;
        }
        return bound;
    }

    /// @summary Unbinds the active array buffer.
    /// @param gl The WebGLRenderingContext.
    /// @return The Buffer bound as the active array buffer, or null.
    DrawContext.prototype.unbindArrayBuffer = function (gl)
    {
        var bound   = this.activeArrayBuffer;
        if (bound !== null)
        {
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            this.activeArrayBuffer = null;
        }
        return bound;
    };

    /// @summary Unbinds the active index buffer.
    /// @param gl The WebGLRenderingContext.
    /// @return The Buffer bound as the active index buffer, or null.
    DrawContext.prototype.unbindIndexBuffer = function (gl)
    {
        var bound   = this.activeIndexBuffer;
        if (bound !== null)
        {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            this.activeIndexBuffer = null;
        }
        return bound;
    };

    /// @summary Unbinds the texture bound to the specified texture unit. The
    /// active texture unit is not modified.
    /// @param gl The WebGLRenderingContext.
    /// @param unit The zero-based index of the texture unit to unbind. If
    /// unspecified, defaults to the active texture unit.
    /// @return The Texture bound to the active texture unit, or null.
    DrawContext.prototype.unbindTexture = function (gl, unit)
    {
        // save and change the active texture unit, if necesary.
        var prev   = this.activeTextureIndex;
        if (unit === undefined)
            unit   = this.activeTextureIndex;
        if (unit !== this.activeTextureIndex)
            gl.activeTexture(gl.TEXTURE0 + unit);

        // unbind the texture, changing the active texture unit if necessary.
        var bound   = this.activeTextures[unit];
        if (bound !== null)
        {
            gl.bindTexture(bound.bindTarget, null);
            this.activeTextures[unit] = null;
        }

        // restore the active texture unit, if necessary.
        if (prev !== unit)
            gl.activeTexture(gl.TEXTURE0 + prev)

        return bound;
    };

    /// @summary Unbinds all currently bound textures. The active texture unit
    /// is reset to unit zero if a texture is currently bound to it.
    /// @param gl The WebGLRenderingContext.
    /// @return The DrawContext.
    DrawContext.prototype.unbindAllTextures = function (gl)
    {
        var texobj = this.activeTextures;
        var unbind = false;
        for (var i = 0, n = texobj.length; i < n; ++i)
        {
            if (texobj[i] !== null)
            {
                gl.activeTexture(gl.TEXTURE0 + i);
                gl.bindTexture(gl.TEXTURE_2D, null);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
                texobj[i] = null;
                unbind    = true;
            }
        }
        if (unbind)
        {
            this.activeTextureIndex = 0;
            gl.activeTexture(gl.TEXTURE0);
        }
        if (this.activeProgram !== null)
            this.activeProgram.boundTextureCount = 0;

        return this;
    };

    /// @summary Unbinds the active shader program.
    /// @param gl The WebGLRenderingContext.
    /// @return The Program bound as the active shader, or null.
    DrawContext.prototype.unbindProgram = function (gl)
    {
        var bound   = this.activeProgram;
        if (bound !== null)
        {
            gl.useProgram(null);
            this.activeProgram = null;
        }
        return bound;
    };

    /// @summary Sets the value of a uniform variable for the active shader.
    /// @param gl The WebGLRenderingContext.
    /// @param name The name of the uniform to update.
    /// @param value The value to assign to the uniform. For vector types, this
    /// is either a JavaScript array or the corresponding ArrayBuffer type. For
    /// scalar attributes, this is a scalar JavaScript value. For samplers,
    /// this is an instance of the WebGL.Texture type.
    /// @return The DrawContext.
    DrawContext.prototype.setUniform = function (gl, name, value)
    {
        var program  = this.activeProgram;
        var location = program.uniformLocations[name];
        var type     = program.uniformTypes[name];
        switch (type)
        {
            case gl.FLOAT_VEC4:
                gl.uniform4fv(location, value);
                break;

            case gl.FLOAT_MAT4:
                gl.uniformMatrix4fv(location, false, value);
                break;

            case gl.SAMPLER_2D:
            case gl.SAMPLER_CUBE:
                this.bindTexture(gl, value, program.boundTextureCount)
                gl.uniform1i(location, program.boundTextureCount);
                program.boundTextureCount++;
                break;

            case gl.FLOAT_VEC3:
                gl.uniform3fv(location, value);
                break;

            case gl.FLOAT_VEC2:
                gl.uniform2fv(location, value);
                break;

            case gl.FLOAT:
                gl.uniform1f(location, value);
                break;

            case gl.FLOAT_MAT3:
                gl.uniformMatrix3fv(location, false, value);
                break;

            case gl.FLOAT_MAT2:
                gl.uniformMatrix2fv(location, false, value);
                break;

            case gl.INT:
            case gl.BOOL:
                gl.uniform1i(location, value);
                break;

            case gl.INT_VEC4:
            case gl.BOOL_VEC4:
                gl.uniform4iv(location, value);
                break;

            case gl.INT_VEC3:
            case gl.BOOL_VEC3:
                gl.uniform3iv(location, value);
                break;

            case gl.INT_VEC2:
            case gl.BOOL_VEC2:
                gl.uniform2iv(location, value);
                break;
        }
        return this;
    };

    /// @summary Sets a vertex attribute to be a constant value. Only floating-
    /// point values (and vectors thereof) may be specified as constants.
    /// @param gl The WebGLRenderingContext.
    /// @param name The name of the vertex attribute. This should match the
    /// name of the attribute in the vertex shader.
    /// @param value The constant vertex attribute value. For vector types,
    /// this is either a JavaScript Number array or a Float32Array instance.
    /// For scalar types, this is a single JavaScript Number value.
    /// @return The DrawContext.
    DrawContext.prototype.setConstantAttribute = function (gl, name, value)
    {
        var program = this.activeProgram;
        var index   = program.attributeIndices[name];
        var type    = program.attributeTypes[name];

        switch (type)
        {
            case gl.FLOAT_VEC4:
                gl.vertexAttrib4fv(index, value);
                gl.disableVertexAttribArray(index);
                break;

            case gl.FLOAT_VEC3:
                gl.vertexAttrib3fv(index, value);
                gl.disableVertexAttribArray(index);
                break;

            case gl.FLOAT_VEC2:
                gl.vertexAttrib2fv(index, value);
                gl.disableVertexAttribArray(index);
                break;

            case gl.FLOAT:
                gl.vertexAttrib1f(index, value);
                gl.disableVertexAttribArray(index);
                break;
        }
        return this;
    };

    /// @summary Sets the array buffer data sources for each vertex attribute
    /// used by the currently bound shader program. This function may change
    /// the currently bound array buffer.
    /// @param gl The WebGLRenderingContext.
    /// @param fields An array of field descriptors describing the layout of
    /// element structures within the source buffers. See WebGL.field().
    /// @param buffers An array of instances of the WebGL.Buffer type specifying
    /// the data source for each vertex attribute. Items in this array have a
    /// one-to-one correspondency with @a fields, such that fields[i] is
    /// sourced from buffers[i].
    /// @return The DrawContext.
    DrawContext.prototype.enableAttributes = function (gl, fields, buffers)
    {
        var program = this.activeProgram;
        var indices = program.attributeIndices;
        for (var  i = 0, n = fields.length; i < n; ++i)
        {
            // @note: gl.vertexAttribPointer captures the
            // buffer bound to gl.ARRAY_BUFFER at call-time.
            var field  = fields [i];
            var buffer = buffers[i];
            var index  = indices[field.name];
            this.bindArrayBuffer(gl, buffer);
            gl.enableVertexAttribArray(index);
            gl.vertexAttribPointer(
                index,
                field.dimension,
                field.dataType,
                field.normalize,
                buffer.elementSize,
                field.byteOffset)
        }
        return this;
    };

    /// @summary Submits a batch of non-indexed primitives to the GPU.
    /// @param gl The WebGLRenderingContext.
    /// @param count The number of vertices to read.
    /// @param offset The zero-based index of the first vertex to read.
    /// @return The DrawContext.
    DrawContext.prototype.points = function (gl, count, offset)
    {
        gl.drawArrays(gl.POINTS, offset, count);
        return this;
    };

    /// @summary Submits a batch of non-indexed primitives to the GPU.
    /// @param gl The WebGLRenderingContext.
    /// @param count The number of vertices to read.
    /// @param offset The zero-based index of the first vertex to read.
    /// @return The DrawContext.
    DrawContext.prototype.lines = function (gl, count, offset)
    {
        gl.drawArrays(gl.LINES, offset, count);
        return this;
    };

    /// @summary Submits a batch of non-indexed primitives to the GPU.
    /// @param gl The WebGLRenderingContext.
    /// @param count The number of vertices to read.
    /// @param offset The zero-based index of the first vertex to read.
    /// @return The DrawContext.
    DrawContext.prototype.lineLoop = function (gl, count, offset)
    {
        gl.drawArrays(gl.LINE_LOOP, offset, count);
        return this;
    };

    /// @summary Submits a batch of non-indexed primitives to the GPU.
    /// @param gl The WebGLRenderingContext.
    /// @param count The number of vertices to read.
    /// @param offset The zero-based index of the first vertex to read.
    /// @return The DrawContext.
    DrawContext.prototype.lineStrip = function (gl, count, offset)
    {
        gl.drawArrays(gl.LINE_STRIP, offset, count);
        return this;
    };

    /// @summary Submits a batch of non-indexed primitives to the GPU.
    /// @param gl The WebGLRenderingContext.
    /// @param count The number of vertices to read.
    /// @param offset The zero-based index of the first vertex to read.
    /// @return The DrawContext.
    DrawContext.prototype.triangles = function (gl, count, offset)
    {
        gl.drawArrays(gl.TRIANGLES, offset, count);
        return this;
    };

    /// @summary Submits a batch of non-indexed primitives to the GPU.
    /// @param gl The WebGLRenderingContext.
    /// @param type A string value indicating the type of primitives to submit.
    /// Supported values are POINTS, LINES, TRIANGLES, LINE_LOOP, LINE_STRIP,
    /// TRIANGLE_FAN and TRIANGLE_STRIP.
    /// @param count The number of vertices to read.
    /// @param offset The zero-based index of the first vertex to read.
    /// @return The DrawContext.
    DrawContext.prototype.triangleFan = function (gl, count, offset)
    {
        gl.drawArrays(gl.TRIANGLE_FAN, offset, count);
        return this;
    };

    /// @summary Submits a batch of non-indexed primitives to the GPU.
    /// @param gl The WebGLRenderingContext.
    /// @param count The number of vertices to read.
    /// @param offset The zero-based index of the first vertex to read.
    /// @return The DrawContext.
    DrawContext.prototype.triangleStrip = function (gl, count, offset)
    {
        gl.drawArrays(gl.TRIANGLE_STRIP, offset, count);
        return this;
    };

    /// @summary Submits a batch of indexed primitives to the GPU.
    /// @param gl The WebGLRenderingContext.
    /// @param count The number of indices to read.
    /// @param offset The zero-based index of the first vertex index.
    /// @param indexSize The size of a single index, in bytes.
    /// @return The DrawContext.
    DrawContext.prototype.indexedTriangles = function (gl, count, offset, indexSize)
    {
        gl.drawElements(gl.TRIANGLES, count, IndexType[indexSize], offset * indexSize);
        return this;
    };

    /// @summary Submits a batch of indexed primitives to the GPU.
    /// @param gl The WebGLRenderingContext.
    /// @param count The number of indices to read.
    /// @param offset The zero-based index of the first vertex index.
    /// @param indexSize The size of a single index, in bytes.
    /// @return The DrawContext.
    DrawContext.prototype.indexedTriangleFan = function (gl, count, offset, indexSize)
    {
        gl.drawElements(gl.TRIANGLE_FAN, count, IndexType[indexSize], offset * indexSize);
        return this;
    };

    /// @summary Submits a batch of indexed primitives to the GPU.
    /// @param gl The WebGLRenderingContext.
    /// @param count The number of indices to read.
    /// @param offset The zero-based index of the first vertex index.
    /// @param indexSize The size of a single index, in bytes.
    /// @return The DrawContext.
    DrawContext.prototype.indexedTriangleStrip = function (gl, count, offset, indexSize)
    {
        gl.drawElements(gl.TRIANGLE_STRIP, count, IndexType[indexSize], offset * indexSize);
        return this;
    };

    /// Constructor function for the core Emitter type, which provides a
    /// simple node.js-style EventEmitter implementation.
    var Emitter = function ()
    {
        /* empty */
    };

    /// Registers an event listener for a particular named event type.
    /// @param event A string specifying the name of the event to listen for.
    /// @param callback A function to invoke when the event is emitted.
    /// @return A reference to the calling context.
    Emitter.prototype.on = function (event, callback)
    {
        var  listeners   = this.listeners   || {};
        var  handler     = listeners[event] || []; handler.push(callback);
        this.listeners   = this.listeners   || listeners;
        listeners[event] = handler;
        return this;
    };

    /// Registers an event listener to be called once for a named event.
    /// @param event A string specifying the name of the event to listen for.
    /// @param callback A function to invoke when the event is emitted.
    /// @return A reference to the calling context.
    Emitter.prototype.once = function (event, callback)
    {
        var self = this;
        var func = function ()
            {
                self.removeListener(event, func);
                callback.apply(this, arguments);
            };
        func.callback = callback;
        return self.on(event, func);
    };

    /// Registers an event listener for a particular named event type.
    /// @param event A string specifying the name of the event to listen for.
    /// @param callback A function to invoke when the event is emitted.
    /// @return A reference to the calling context.
    Emitter.prototype.addListener = Emitter.prototype.on; // alias

    /// Removes a registered event listener for a particular named event type.
    /// @param event A string specifying the name of the event.
    /// @param callback The callback function registered to listen for @a event
    /// and identifying which listener to remove.
    /// @return A reference to the calling context.
    Emitter.prototype.removeListener = function (event, callback)
    {
        var  listeners   = this.listeners   || {};
        var  handler     = listeners[event] || [];
        this.listeners   = this.listeners   || listeners;
        handler.splice(handler.indexOf(callback), 1);
        listeners[event] = handler;
        return this;
    };

    /// Removes all registered event listeners for a particular event type.
    /// @param event A string specifying the name of the event.
    /// @return A reference to the calling context.
    Emitter.prototype.removeAllListeners = function (event)
    {
        var  listeners   = this.listeners || {};
        this.listeners   = this.listeners || listeners;
        listeners[event] = null;
        return this;
    };

    /// Emits a named event, immediately invoking all registered listeners. Any
    /// additional arguments aside from @a event are passed to the listeners.
    /// @param event A string specifying the name of the event being raised.
    /// @return A reference to the calling context.
    Emitter.prototype.emit = function (event)
    {
        var  listeners = this.listeners || {};
        this.listeners = this.listeners || listeners;
        var  listener  = this.listeners[event];
        if  (listener)
        {
            var count  = arguments.length;
            var n      = listener.length;
            var i      = 0;
            switch (count)
            {
                case 1:
                    for (i = 0; i < n; ++i)
                    {
                        listener[i].call(this);
                    }
                    break;
                case 2:
                    for (i = 0; i < n; ++i)
                    {
                        listener[i].call(this, arguments[1]);
                    }
                    break;
                case 3:
                    for (i = 0; i < n; ++i)
                    {
                        listener[i].call(this, arguments[1], arguments[2]);
                    }
                    break;
                default:
                    var args = Array.prototype.slice.call(arguments, 1);
                    for (i   = 0; i < n; ++i)
                    {
                        listener[i].apply(this, args);
                    }
                    break;
            }
        }
        return this;
    };

    /// Adds the methods of the Emitter object to a specific instance of an
    /// existing object. This is different from the inherits() function, which
    /// adds the Emitter methods to the object prototype.
    /// @param target The target object instance.
    /// @return A reference to @a target.
    Emitter.extend = function (target)
    {
        target                    = target || {};
        target.on                 = Emitter.prototype.on;
        target.once               = Emitter.prototype.once;
        target.emit               = Emitter.prototype.emit;
        target.addListener        = Emitter.prototype.addListener;
        target.removeListener     = Emitter.prototype.removeListener;
        target.removeAllListeners = Emitter.prototype.removeAllListeners;
        return target;
    };

    /// Set the functions exported from the module.
    exports.GL                     = WebGLConstants;
    exports.ResourceType           = ResourceType;
    exports.ResourceSubType        = ResourceSubType;

    exports.enumraw                = enumraw; // for use when debugging
    exports.enumfmt                = enumfmt; // for use when debugging
    exports.supported              = supported;
    exports.createContext          = createContext;
    exports.field                  = field;
    exports.fieldSize              = fieldSize;
    exports.elementSize            = elementSize;
    exports.orderByByteOffset      = orderByByteOffset;
    exports.createBufferView       = createBufferView;
    exports.resetBufferView        = resetBufferView;
    exports.interleave             = interleave;
    exports.createImageView        = createImageView;
    exports.imageStorageAttributes = imageStorageAttributes;
    exports.mipLevelCount          = mipLevelCount;
    exports.mipLevelDimension      = mipLevelDimension;

    exports.Buffer                 = Buffer;
    exports.Texture                = Texture;
    exports.Program                = Program;
    exports.Renderbuffer           = Renderbuffer;
    exports.Framebuffer            = Framebuffer;
    exports.BlendState             = BlendState;
    exports.RasterState            = RasterState;
    exports.DepthStencilState      = DepthStencilState;
    exports.DrawContext            = DrawContext;
    exports.Emitter                = Emitter;

    return exports;
}  (WebGL || {}));
