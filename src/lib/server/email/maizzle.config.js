/** @type {import('@maizzle/framework').Config} */
export default {
	css: {
		inline: {},
		tailwind: {
			content: ['templates/**/*.html']
		}
	},
	build: {
		content: ['templates/otp.maizzle.html'],
		output: {
			path: 'templates/build',
			extension: 'html',
			from: 'templates'
		}
	}
};
